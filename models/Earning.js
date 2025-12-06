const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true // One earning record per order per user
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  userType: {
    type: String,
    enum: ['vendor', 'rider'],
    required: true
  },
  // Financial breakdown
  grossAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Additional fees and adjustments
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  platformFee: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  tipAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid', 'disputed'],
    default: 'pending'
  },
  // Payout information
  payoutDate: Date,
  payoutBatchId: String,
  // Tax information
  taxYear: Number,
  taxMonth: Number,
  // Metadata and audit
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  paidAt: Date
}, {
  timestamps: true
});

// Indexes for performance
earningsSchema.index({ user: 1, createdAt: -1 });
earningsSchema.index({ order: 1 });
earningsSchema.index({ restaurant: 1 });
earningsSchema.index({ userType: 1 });
earningsSchema.index({ status: 1 });
earningsSchema.index({ payoutDate: 1 });
earningsSchema.index({ taxYear: 1, taxMonth: 1 });

// Virtual for formatted amounts
earningsSchema.virtual('formattedGrossAmount').get(function() {
  return `$${this.grossAmount.toFixed(2)}`;
});

earningsSchema.virtual('formattedNetAmount').get(function() {
  return `$${this.netAmount.toFixed(2)}`;
});

earningsSchema.virtual('formattedCommissionAmount').get(function() {
  return `$${this.commissionAmount.toFixed(2)}`;
});

// Pre-save middleware to calculate amounts
earningsSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('grossAmount') || this.isModified('commissionRate')) {
    // Calculate commission amount
    this.commissionAmount = (this.grossAmount * this.commissionRate) / 100;
    
    // Calculate net amount (gross - commission - fees + tip)
    this.netAmount = this.grossAmount - this.commissionAmount - this.platformFee + this.tipAmount;
  }
  
  // Set tax period
  if (this.createdAt) {
    this.taxYear = this.createdAt.getFullYear();
    this.taxMonth = this.createdAt.getMonth() + 1;
  }
  
  next();
});

// Method to mark as paid
earningsSchema.methods.markAsPaid = async function(payoutBatchId = null) {
  this.status = 'paid';
  this.paidAt = new Date();
  if (payoutBatchId) {
    this.payoutBatchId = payoutBatchId;
  }
  await this.save();
  return this;
};

// Method to mark as processed
earningsSchema.methods.markAsProcessed = async function() {
  this.status = 'processed';
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Static method to calculate earnings for an order
earningsSchema.statics.calculateOrderEarnings = async function(orderId) {
  const Order = require('./Order');
  const Restaurant = require('./Restaurant');
  
  const order = await Order.findById(orderId).populate('restaurant');
  if (!order) {
    throw new Error('Order not found');
  }
  
  const restaurant = await Restaurant.findById(order.restaurant);
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }
  
  const earnings = [];
  
  // Calculate vendor earnings (restaurant owner)
  if (restaurant.owner) {
    const vendorEarning = await this.create({
      user: restaurant.owner,
      order: order._id,
      restaurant: restaurant._id,
      userType: 'vendor',
      grossAmount: order.orderAmount,
      commissionRate: restaurant.commissionRate || 0,
      deliveryFee: order.deliveryCharges,
      taxAmount: order.taxationAmount,
      tipAmount: order.tipping,
      discountAmount: 0, // Would need to calculate from order items
      platformFee: 0 // Platform fee for vendor
    });
    earnings.push(vendorEarning);
  }
  
  // Calculate rider earnings (if assigned)
  if (order.rider) {
    // Rider gets a fixed amount or percentage of delivery fee
    const riderEarningAmount = Math.max(order.deliveryCharges * 0.8, 2.0); // Minimum $2, 80% of delivery fee
    const riderCommissionRate = 0; // Riders typically don't pay commission
    
    const riderEarning = await this.create({
      user: order.rider,
      order: order._id,
      restaurant: restaurant._id,
      userType: 'rider',
      grossAmount: riderEarningAmount,
      commissionRate: riderCommissionRate,
      deliveryFee: order.deliveryCharges,
      tipAmount: order.tipping,
      platformFee: 0 // No platform fee for riders
    });
    earnings.push(riderEarning);
  }
  
  return earnings;
};

// Static method to get earnings summary for a user
earningsSchema.statics.getUserEarningsSummary = async function(userId, startDate = null, endDate = null) {
  const matchStage = { user: mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        totalGross: { $sum: '$grossAmount' },
        totalNet: { $sum: '$netAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    totalEarnings: 0,
    totalGross: 0,
    totalNet: 0,
    totalCommission: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    processedEarnings: 0,
    orderCount: 0
  };
  
  summary.forEach(item => {
    result.totalGross += item.totalGross;
    result.totalNet += item.totalNet;
    result.totalCommission += item.totalCommission;
    result.orderCount += item.count;
    
    switch (item._id) {
      case 'pending':
        result.pendingEarnings = item.totalNet;
        break;
      case 'processed':
        result.processedEarnings = item.totalNet;
        break;
      case 'paid':
        result.paidEarnings = item.totalNet;
        break;
    }
  });
  
  result.totalEarnings = result.totalNet;
  
  return result;
};

// Static method to get monthly earnings report
earningsSchema.statics.getMonthlyReport = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return await this.find({
    user: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).sort({ createdAt: -1 });
};

// Static method to get top earning restaurants for a vendor
earningsSchema.statics.getTopRestaurantsByEarnings = async function(userId, limit = 10) {
  return await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$restaurant',
        totalEarnings: { $sum: '$netAmount' },
        orderCount: { $sum: 1 },
        averageEarning: { $avg: '$netAmount' }
      }
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    { $unwind: '$restaurant' }
  ]);
};

module.exports = mongoose.model('Earning', earningsSchema);
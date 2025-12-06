const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  // Payment method details
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'manual'],
    required: true
  },
  paymentDetails: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    routingNumber: String,
    swiftCode: String,
    paypalEmail: String,
    stripeAccountId: String
  },
  // Processing details
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  processingNotes: String,
  // External transaction reference
  transactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  // Audit trail
  rejectionReason: String,
  cancelledReason: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
withdrawalSchema.index({ user: 1, createdAt: -1 });
withdrawalSchema.index({ wallet: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate net amount
withdrawalSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount') || this.isModified('fee')) {
    this.netAmount = this.amount - this.fee;
  }
  next();
});

// Virtual for formatted amount
withdrawalSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for formatted net amount
withdrawalSchema.virtual('formattedNetAmount').get(function() {
  return `$${this.netAmount.toFixed(2)}`;
});

// Method to approve withdrawal
withdrawalSchema.methods.approve = async function(processedBy, notes = '') {
  if (this.status !== 'pending') {
    throw new Error('Withdrawal can only be approved when pending');
  }
  
  this.status = 'processing';
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.processingNotes = notes;
  await this.save();
  
  return this;
};

// Method to complete withdrawal
withdrawalSchema.methods.complete = async function(transactionId, gatewayResponse = {}) {
  if (this.status !== 'processing') {
    throw new Error('Withdrawal can only be completed when processing');
  }
  
  this.status = 'completed';
  this.transactionId = transactionId;
  this.gatewayResponse = gatewayResponse;
  await this.save();
  
  return this;
};

// Method to reject withdrawal
withdrawalSchema.methods.reject = async function(processedBy, reason) {
  if (this.status !== 'pending') {
    throw new Error('Withdrawal can only be rejected when pending');
  }
  
  this.status = 'rejected';
  this.processedBy = processedBy;
  this.processedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
  
  // Refund the amount back to wallet
  const Wallet = require('./Wallet');
  const wallet = await Wallet.findById(this.wallet);
  if (wallet) {
    await wallet.addBalance(this.amount, `Withdrawal rejected: ${reason}`, this._id);
  }
  
  return this;
};

// Method to cancel withdrawal
withdrawalSchema.methods.cancel = async function(reason) {
  if (this.status !== 'pending') {
    throw new Error('Withdrawal can only be cancelled when pending');
  }
  
  this.status = 'cancelled';
  this.cancelledReason = reason;
  await this.save();
  
  // Refund the amount back to wallet
  const Wallet = require('./Wallet');
  const wallet = await Wallet.findById(this.wallet);
  if (wallet) {
    await wallet.addBalance(this.amount, `Withdrawal cancelled: ${reason}`, this._id);
  }
  
  return this;
};

// Static method to get withdrawal statistics
withdrawalSchema.statics.getStatistics = async function(userId = null, startDate = null, endDate = null) {
  const matchStage = {};
  
  if (userId) matchStage.user = mongoose.Types.ObjectId(userId);
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    totalAmount: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    result.totalAmount += stat.totalAmount;
    
    switch (stat._id) {
      case 'pending':
        result.pending = stat.count;
        break;
      case 'processing':
        result.processing = stat.count;
        break;
      case 'completed':
        result.completed = stat.count;
        break;
      case 'rejected':
        result.rejected = stat.count;
        break;
      case 'cancelled':
        result.cancelled = stat.count;
        break;
    }
  });
  
  return result;
};

// Static method to get user's withdrawal history
withdrawalSchema.statics.getUserWithdrawals = async function(userId, limit = 20, skip = 0) {
  return await this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('processedBy', 'name email');
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
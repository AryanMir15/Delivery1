const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed', 'free_delivery'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minimumAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maximumDiscountAmount: {
    type: Number,
    min: 0
  },
  usageLimit: {
    type: Number,
    default: 0, // 0 means unlimited
    min: 0
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1, // Default 1 use per user
    min: 1
  },
  applicableRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableFoods: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  }],
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFirstTimeUser: {
    type: Boolean,
    default: false
  },
  daysOfWeek: [{
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6], // 0 = Sunday, 6 = Saturday
    default: [0, 1, 2, 3, 4, 5, 6]
  }],
  startTime: {
    type: String, // Format: "HH:MM"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format.'
    }
  },
  endTime: {
    type: String, // Format: "HH:MM"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format.'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    discountAmount: {
      type: Number,
      required: true
    },
    orderAmount: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ applicableRestaurants: 1 });
couponSchema.index({ usageLimit: 1, usedCount: 1 });

// Validate date ranges
couponSchema.pre('save', function(next) {
  if (this.validFrom && this.validUntil && this.validFrom >= this.validUntil) {
    next(new Error('Valid from date must be before valid until date'));
  }
  next();
});

// Generate unique code if not provided
couponSchema.pre('save', async function(next) {
  if (!this.code) {
    this.code = await generateUniqueCouponCode();
  }
  next();
});

async function generateUniqueCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Check if code already exists
  const existingCoupon = await mongoose.model('Coupon').findOne({ code: result });
  if (existingCoupon) {
    return generateUniqueCouponCode(); // Recursively generate if exists
  }
  
  return result;
}

// Method to check if coupon is currently valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (now < this.validFrom) return false;
  if (now > this.validUntil) return false;
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) return false;
  
  // Check day of week
  const currentDay = now.getDay();
  if (!this.daysOfWeek.includes(currentDay)) return false;
  
  // Check time range
  if (this.startTime && this.endTime) {
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    if (currentTime < this.startTime || currentTime > this.endTime) return false;
  }
  
  return true;
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (!this.isValid()) {
    return 0;
  }
  
  if (orderAmount < this.minimumAmount) {
    return 0;
  }
  
  let discount = 0;
  
  switch (this.discountType) {
    case 'percentage':
      discount = (orderAmount * this.discountValue) / 100;
      break;
    case 'fixed':
      discount = this.discountValue;
      break;
    case 'free_delivery':
      discount = 0; // Free delivery is handled separately in order calculation
      break;
  }
  
  // Apply maximum discount cap if set
  if (this.maximumDiscountAmount && discount > this.maximumDiscountAmount) {
    discount = this.maximumDiscountAmount;
  }
  
  // Ensure discount doesn't exceed order amount
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);
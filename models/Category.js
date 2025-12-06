const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  // Business category type
  businessType: {
    type: String,
    enum: [
      'grocery',
      'restaurant',
      'pharmacy',
      'electronics',
      'fashion',
      'furniture',
      'flowers',
      'agriculture',
      'beverages',
      'logistics',
      'beauty',
      'medical',
      'stationery',
      'pet_supplies',
      'automotive'
    ],
    default: 'restaurant'
  },
  // Category-specific features
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  allowsBulkOrders: {
    type: Boolean,
    default: false
  },
  serviceType: {
    type: String,
    enum: ['product', 'service', 'both'],
    default: 'product'
  },
  // Display settings
  icon: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#FF6B35'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
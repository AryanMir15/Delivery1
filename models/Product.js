const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  variations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variation'
  }],
  subCategory: {
    type: String,
    trim: true
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
productSchema.index({ shop: 1, category: 1 });
productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
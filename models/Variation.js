const mongoose = require('mongoose');

const variationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discounted: {
    type: Number,
    default: 0,
    min: 0
  },
  addons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Addon'
  }],
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

module.exports = mongoose.model('Variation', variationSchema);
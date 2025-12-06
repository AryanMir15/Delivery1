const mongoose = require('mongoose');

const addonOptionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isOutOfStock: {
    type: Boolean,
    default: false
  }
});

const addonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantityMinimum: {
    type: Number,
    default: 0,
    min: 0
  },
  quantityMaximum: {
    type: Number,
    default: 1,
    min: 0
  },
  options: [addonOptionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Addon', addonSchema);
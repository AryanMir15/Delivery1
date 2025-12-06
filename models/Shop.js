const mongoose = require('mongoose');

const openingTimeSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  times: [{
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  }]
});

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopType: {
    type: String,
    default: 'general',
    enum: ['general', 'grocery', 'pharmacy', 'electronics', 'fashion', 'furniture', 'flowers', 'agriculture', 'beverages', 'logistics', 'beauty', 'medical', 'stationery', 'pet_supplies', 'automotive', 'restaurant', 'other']
  },
  cuisines: [{
    type: String,
    trim: true
  }],
  openingTimes: [openingTimeSchema],
  minimumOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryTime: {
    type: Number,
    default: 30,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  commissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stripeDetailsSubmitted: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryBounds: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]],
      index: '2dsphere'
    }
  }
}, {
  timestamps: true
});

// Create slug from name before saving
shopSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

// Indexes for efficient queries
shopSchema.index({ location: '2dsphere' });
shopSchema.index({ owner: 1 });
shopSchema.index({ isActive: 1, isAvailable: 1 });

module.exports = mongoose.model('Shop', shopSchema);
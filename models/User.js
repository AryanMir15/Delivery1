const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'rider', 'vendor', 'owner', 'admin'],
    default: 'customer',
  },
  profileImage: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Customer specific fields
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  }],
  phoneIsVerified: {
    type: Boolean,
    default: false,
  },
  emailIsVerified: {
    type: Boolean,
    default: false,
  },
  isOrderNotification: {
    type: Boolean,
    default: true,
  },
  isOfferNotification: {
    type: Boolean,
    default: true,
  },
  favourite: [{
    type: String,
  }],
  // Restaurant specific fields
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
  }],
  // Rider specific fields
  vehicleType: {
    type: String,
    enum: ['bike', 'car', 'truck', 'scooter'],
    required: function() { return this.role === 'rider'; }
  },
  licenseNumber: {
    type: String,
    trim: true,
    required: function() { return this.role === 'rider'; }
  },
  vehicleNumber: {
    type: String,
    trim: true,
    required: function() { return this.role === 'rider'; }
  },
  available: {
    type: Boolean,
    default: false,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
  },
  heading: {
    type: Number,
    default: 0,
  },
  // Vendor specific fields
  address: {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'United States'
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
    },
  },
  // Super admin specific fields
  permissions: [{
    type: String,
    enum: [
      'manage_vendors',
      'manage_restaurants',
      'manage_users',
      'manage_orders',
      'manage_settings',
      'view_analytics',
      'manage_payments',
      'system_administration'
    ]
  }],
  // Common fields
  notificationToken: {
    type: String,
  },
  timeZone: {
    type: String,
    default: 'UTC',
  },
}, {
  timestamps: true,
});

// Index for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ 'address.coordinates': '2dsphere' });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.zipCode,
    this.address.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Method to check if user is super admin
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'admin' && this.permissions && this.permissions.includes('system_administration');
};

// Method to check permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin' && this.permissions) {
    return this.permissions.includes(permission) || this.permissions.includes('system_administration');
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);

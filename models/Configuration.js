const mongoose = require('mongoose');

const configurationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, boolean, object, array
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'payment',
      'delivery',
      'notification',
      'security',
      'performance',
      'business',
      'integration'
    ],
    default: 'general'
  },
  dataType: {
    type: String,
    required: true,
    enum: ['string', 'number', 'boolean', 'object', 'array', 'json'],
    default: 'string'
  },
  isPublic: {
    type: Boolean,
    default: false // Whether this config is accessible via public API
  },
  isEditable: {
    type: Boolean,
    default: true // Whether this config can be edited via API
  },
  validation: {
    required: {
      type: Boolean,
      default: false
    },
    min: Number, // For numbers
    max: Number, // For numbers
    pattern: String, // Regex pattern for strings
    options: [mongoose.Schema.Types.Mixed], // For enums/select options
    minLength: Number, // For strings/arrays
    maxLength: Number // For strings/arrays
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  environment: {
    type: String,
    enum: ['development', 'staging', 'production', 'all'],
    default: 'all'
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
configurationSchema.index({ category: 1 });
configurationSchema.index({ isPublic: 1 });
configurationSchema.index({ isActive: 1 });
configurationSchema.index({ environment: 1 });
configurationSchema.index({ key: 1, environment: 1 }, { unique: true });

// Static method to get configuration by key
configurationSchema.statics.getValue = async function(key, defaultValue = null) {
  try {
    const config = await this.findOne({ 
      key: key.toLowerCase(), 
      isActive: true,
      $or: [
        { environment: process.env.NODE_ENV || 'development' },
        { environment: 'all' }
      ]
    }).sort({ environment: -1 }); // Prefer specific environment over 'all'
    
    return config ? config.value : defaultValue;
  } catch (error) {
    console.error(`Error getting configuration ${key}:`, error);
    return defaultValue;
  }
};

// Static method to get multiple configurations
configurationSchema.statics.getValues = async function(keys) {
  try {
    const configs = await this.find({ 
      key: { $in: keys.map(k => k.toLowerCase()) }, 
      isActive: true,
      $or: [
        { environment: process.env.NODE_ENV || 'development' },
        { environment: 'all' }
      ]
    }).sort({ environment: -1 });
    
    const result = {};
    const seen = new Set();
    
    // Only take the first match for each key (highest priority environment)
    configs.forEach(config => {
      if (!seen.has(config.key)) {
        result[config.key] = config.value;
        seen.add(config.key);
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting configurations:', error);
    return {};
  }
};

// Static method to get configurations by category
configurationSchema.statics.getByCategory = async function(category) {
  try {
    return await this.find({ 
      category, 
      isActive: true,
      $or: [
        { environment: process.env.NODE_ENV || 'development' },
        { environment: 'all' }
      ]
    }).sort({ key: 1 });
  } catch (error) {
    console.error(`Error getting configurations by category ${category}:`, error);
    return [];
  }
};

// Method to validate configuration value
configurationSchema.methods.validateValue = function(value) {
  const { validation } = this;
  
  if (validation.required && (value === undefined || value === null)) {
    return { isValid: false, message: 'Value is required' };
  }
  
  if (value === undefined || value === null) {
    return { isValid: true }; // Not required and not provided
  }
  
  // Type validation
  switch (this.dataType) {
    case 'string':
      if (typeof value !== 'string') {
        return { isValid: false, message: 'Value must be a string' };
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { isValid: false, message: 'Value must be a number' };
      }
      if (validation.min !== undefined && value < validation.min) {
        return { isValid: false, message: `Value must be at least ${validation.min}` };
      }
      if (validation.max !== undefined && value > validation.max) {
        return { isValid: false, message: `Value must be at most ${validation.max}` };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { isValid: false, message: 'Value must be a boolean' };
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return { isValid: false, message: 'Value must be an array' };
      }
      if (validation.minLength !== undefined && value.length < validation.minLength) {
        return { isValid: false, message: `Array must have at least ${validation.minLength} items` };
      }
      if (validation.maxLength !== undefined && value.length > validation.maxLength) {
        return { isValid: false, message: `Array must have at most ${validation.maxLength} items` };
      }
      break;
  }
  
  // Pattern validation for strings
  if (this.dataType === 'string' && validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return { isValid: false, message: 'Value format is invalid' };
    }
  }
  
  // Options validation (enum)
  if (validation.options && validation.options.length > 0) {
    if (!validation.options.includes(value)) {
      return { 
        isValid: false, 
        message: `Value must be one of: ${validation.options.join(', ')}` 
      };
    }
  }
  
  return { isValid: true };
};

// Method to set configuration value with validation
configurationSchema.methods.setValue = async function(value, userId) {
  const validation = this.validateValue(value);
  
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
  
  this.value = value;
  this.version += 1;
  this.updatedBy = userId;
  
  return await this.save();
};

// Static method to initialize default configurations
configurationSchema.statics.initializeDefaults = async function() {
  const defaultConfigs = [
    // General Settings
    { key: 'app_name', value: 'Food Delivery Multivendor', category: 'general', dataType: 'string', description: 'Application name' },
    { key: 'app_version', value: '1.0.0', category: 'general', dataType: 'string', description: 'Application version' },
    { key: 'default_language', value: 'en', category: 'general', dataType: 'string', description: 'Default language code', validation: { options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'] } },
    { key: 'timezone', value: 'UTC', category: 'general', dataType: 'string', description: 'Default timezone' },
    { key: 'date_format', value: 'YYYY-MM-DD', category: 'general', dataType: 'string', description: 'Default date format' },
    { key: 'time_format', value: '24h', category: 'general', dataType: 'string', description: 'Default time format', validation: { options: ['12h', '24h'] } },
    
    // Payment Settings
    { key: 'default_currency', value: 'USD', category: 'payment', dataType: 'string', description: 'Default currency code', isPublic: true },
    { key: 'currency_symbol', value: '$', category: 'payment', dataType: 'string', description: 'Currency symbol', isPublic: true },
    { key: 'tax_rate', value: 0, category: 'payment', dataType: 'number', description: 'Default tax rate (%)', validation: { min: 0, max: 100 } },
    { key: 'service_fee_rate', value: 0, category: 'payment', dataType: 'number', description: 'Service fee rate (%)', validation: { min: 0, max: 100 } },
    { key: 'minimum_order_amount', value: 0, category: 'payment', dataType: 'number', description: 'Minimum order amount', validation: { min: 0 } },
    
    // Delivery Settings
    { key: 'default_delivery_fee', value: 5.0, category: 'delivery', dataType: 'number', description: 'Default delivery fee', validation: { min: 0 }, isPublic: true },
    { key: 'free_delivery_threshold', value: 0, category: 'delivery', dataType: 'number', description: 'Free delivery minimum amount', validation: { min: 0 } },
    { key: 'delivery_radius', value: 10, category: 'delivery', dataType: 'number', description: 'Default delivery radius (km)', validation: { min: 1, max: 100 }, isPublic: true },
    { key: 'estimated_delivery_time', value: 30, category: 'delivery', dataType: 'number', description: 'Estimated delivery time (minutes)', validation: { min: 5, max: 180 }, isPublic: true },
    
    // Business Settings
    { key: 'commission_rate', value: 10, category: 'business', dataType: 'number', description: 'Platform commission rate (%)', validation: { min: 0, max: 100 } },
    { key: 'vendor_approval_required', value: true, category: 'business', dataType: 'boolean', description: 'Require admin approval for new vendors' },
    { key: 'auto_accept_orders', value: false, category: 'business', dataType: 'boolean', description: 'Auto-accept new orders' },
    { key: 'order_expiry_time', value: 30, category: 'business', dataType: 'number', description: 'Order expiry time (minutes)', validation: { min: 5, max: 120 } },
    
    // Security Settings
    { key: 'jwt_expiry', value: 24, category: 'security', dataType: 'number', description: 'JWT token expiry (hours)', validation: { min: 1, max: 168 } },
    { key: 'max_login_attempts', value: 5, category: 'security', dataType: 'number', description: 'Maximum login attempts before lockout', validation: { min: 3, max: 10 } },
    { key: 'password_min_length', value: 8, category: 'security', dataType: 'number', description: 'Minimum password length', validation: { min: 6, max: 50 } },
    { key: 'require_email_verification', value: true, category: 'security', dataType: 'boolean', description: 'Require email verification for new users' },
    { key: 'require_phone_verification', value: true, category: 'security', dataType: 'boolean', description: 'Require phone verification for new users' },
    
    // Notification Settings
    { key: 'enable_push_notifications', value: true, category: 'notification', dataType: 'boolean', description: 'Enable push notifications', isPublic: true },
    { key: 'enable_email_notifications', value: true, category: 'notification', dataType: 'boolean', description: 'Enable email notifications' },
    { key: 'enable_sms_notifications', value: true, category: 'notification', dataType: 'boolean', description: 'Enable SMS notifications' },
    { key: 'notification_sound_enabled', value: true, category: 'notification', dataType: 'boolean', description: 'Enable notification sounds', isPublic: true },
    
    // Integration Settings
    { key: 'google_maps_enabled', value: true, category: 'integration', dataType: 'boolean', description: 'Enable Google Maps integration', isPublic: true },
    { key: 'stripe_enabled', value: false, category: 'integration', dataType: 'boolean', description: 'Enable Stripe payments' },
    { key: 'paypal_enabled', value: false, category: 'integration', dataType: 'boolean', description: 'Enable PayPal payments' },
    { key: 'facebook_login_enabled', value: false, category: 'integration', dataType: 'boolean', description: 'Enable Facebook login', isPublic: true },
    { key: 'google_login_enabled', value: false, category: 'integration', dataType: 'boolean', description: 'Enable Google login', isPublic: true },
    
    // Performance Settings
    { key: 'api_rate_limit', value: 1000, category: 'performance', dataType: 'number', description: 'API rate limit (requests per hour)', validation: { min: 100 } },
    { key: 'cache_ttl', value: 3600, category: 'performance', dataType: 'number', description: 'Cache TTL (seconds)', validation: { min: 60, max: 86400 } },
    { key: 'enable_caching', value: true, category: 'performance', dataType: 'boolean', description: 'Enable API response caching' }
  ];
  
  for (const config of defaultConfigs) {
    const existing = await this.findOne({ key: config.key });
    if (!existing) {
      await this.create(config);
    }
  }
};

module.exports = mongoose.model('Configuration', configurationSchema);
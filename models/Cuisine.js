const mongoose = require('mongoose');

const cuisineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  icon: {
    type: String // Icon class or emoji
  },
  shopType: {
    type: String,
    enum: [
      'restaurant', 'cafe', 'fast_food', 'grocery', 'pharmacy', 
      'shopping', 'delivery', 'all'
    ],
    default: 'restaurant',
    required: true
  },
  // Display settings
  isActive: {
    type: Boolean,
    default: true
  },
  position: {
    type: Number,
    default: 0
  },
  // Statistics
  restaurantCount: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  // SEO and metadata
  metaTitle: String,
  metaDescription: String,
  tags: [String],
  // Category hierarchy
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuisine'
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuisine'
  }],
  level: {
    type: Number,
    default: 0
  },
  // Color scheme for UI
  color: {
    primary: {
      type: String,
      default: '#FF6B35'
    },
    secondary: {
      type: String,
      default: '#F7931E'
    },
    background: {
      type: String,
      default: '#FFF8F0'
    }
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
cuisineSchema.index({ name: 1 });
cuisineSchema.index({ slug: 1, unique: true });
cuisineSchema.index({ shopType: 1 });
cuisineSchema.index({ isActive: 1 });
cuisineSchema.index({ position: 1 });
cuisineSchema.index({ parent: 1 });
cuisineSchema.index({ level: 1 });

// Index for text search
cuisineSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for formatted average rating
cuisineSchema.virtual('formattedRating').get(function() {
  return this.averageRating.toFixed(1);
});

// Virtual for children count
cuisineSchema.virtual('childrenCount').get(function() {
  return this.children ? this.children.length : 0;
});

// Pre-save middleware to generate slug
cuisineSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to calculate hierarchy level
cuisineSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('parent')) {
    if (this.parent) {
      const parentCuisine = await this.constructor.findById(this.parent);
      if (parentCuisine) {
        this.level = parentCuisine.level + 1;
      }
    } else {
      this.level = 0;
    }
  }
  next();
});

// Method to add child cuisine
cuisineSchema.methods.addChild = async function(childId) {
  if (!this.children.includes(childId)) {
    this.children.push(childId);
    await this.save();
  }
  return this;
};

// Method to remove child cuisine
cuisineSchema.methods.removeChild = async function(childId) {
  this.children = this.children.filter(id => !id.equals(childId));
  await this.save();
  return this;
};

// Method to update statistics
cuisineSchema.methods.updateStatistics = async function() {
  const Restaurant = require('./Restaurant');
  const Order = require('./Order');
  
  // Count restaurants
  const restaurantCount = await Restaurant.countDocuments({
    cuisines: this._id,
    isActive: true
  });
  
  // Count orders (this is a simplified version)
  const orderCount = await Order.countDocuments({
    isActive: true
    // In a real implementation, you'd join with restaurant data
  });
  
  this.restaurantCount = restaurantCount;
  this.orderCount = orderCount;
  
  await this.save();
  return this;
};

// Method to get full hierarchy path
cuisineSchema.methods.getHierarchyPath = async function() {
  const path = [this];
  let current = this;
  
  while (current.parent) {
    current = await this.constructor.findById(current.parent);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }
  
  return path;
};

// Static method to get cuisines by shop type
cuisineSchema.statics.getCuisinesByShopType = async function(shopType, includeInactive = false) {
  const query = {};
  
  if (shopType) {
    query.shopType = shopType;
  }
  
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return await this.find(query)
    .sort({ position: 1, name: 1 })
    .populate('parent', 'name slug')
    .populate('children', 'name slug');
};

// Static method to get root cuisines
cuisineSchema.statics.getRootCuisines = async function() {
  return await this.find({ parent: null, isActive: true })
    .sort({ position: 1, name: 1 })
    .populate('children');
};

// Static method to get cuisine tree
cuisineSchema.statics.getCuisineTree = async function(shopType = null) {
  const query = { isActive: true };
  
  if (shopType) {
    query.shopType = shopType;
  }
  
  const cuisines = await this.find(query).sort({ position: 1, name: 1 });
  
  // Build tree structure
  const cuisineMap = new Map();
  const roots = [];
  
  // First pass: create map
  cuisines.forEach(cuisine => {
    cuisineMap.set(cuisine._id.toString(), {
      ...cuisine.toObject(),
      children: []
    });
  });
  
  // Second pass: build hierarchy
  cuisines.forEach(cuisine => {
    const cuisineData = cuisineMap.get(cuisine._id.toString());
    
    if (cuisine.parent) {
      const parent = cuisineMap.get(cuisine.parent.toString());
      if (parent) {
        parent.children.push(cuisineData);
      }
    } else {
      roots.push(cuisineData);
    }
  });
  
  return roots;
};

// Static method to get popular cuisines
cuisineSchema.statics.getPopularCuisines = async function(limit = 10) {
  return await this.find({ isActive: true })
    .sort({ restaurantCount: -1, orderCount: -1 })
    .limit(limit);
};

// Static method to search cuisines
cuisineSchema.statics.searchCuisines = async function(searchTerm, shopType = null) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };
  
  if (shopType) {
    query.shopType = shopType;
  }
  
  return await this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .populate('parent', 'name slug')
    .populate('children', 'name slug');
};

// Static method to get cuisine analytics
cuisineSchema.statics.getAnalytics = async function(shopType = null) {
  const matchStage = { isActive: true };
  
  if (shopType) {
    matchStage.shopType = shopType;
  }
  
  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$shopType',
        totalCuisines: { $sum: 1 },
        totalRestaurants: { $sum: '$restaurantCount' },
        totalOrders: { $sum: '$orderCount' },
        averageRating: { $avg: '$averageRating' }
      }
    },
    {
      $sort: { totalRestaurants: -1 }
    }
  ]);
  
  return analytics;
};

module.exports = mongoose.model('Cuisine', cuisineSchema);
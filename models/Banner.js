const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Image and media
  image: {
    type: String,
    required: true
  },
  video: {
    type: String
  },
  // Link configuration
  link: {
    url: String,
    type: {
      type: String,
      enum: ['restaurant', 'food', 'category', 'external', 'none'],
      default: 'none'
    },
    referenceId: mongoose.Schema.Types.ObjectId,
    parameters: mongoose.Schema.Types.Mixed
  },
  // Targeting
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'existing_users', 'vip', 'location_based'],
    default: 'all'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  radius: {
    type: Number,
    default: 10, // km
    min: 0
  },
  // Schedule
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Display settings
  position: {
    type: String,
    enum: ['top', 'middle', 'bottom', 'sidebar', 'popup'],
    default: 'middle'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  clickThroughRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // A/B testing
  variant: {
    type: String,
    default: 'A'
  },
  // Restrictions
  maxViews: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  maxClicks: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  // Device targeting
  platforms: [{
    type: String,
    enum: ['web', 'mobile', 'ios', 'android']
  }],
  // Category/Restaurant targeting
  applicableRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ isActive: 1 });
bannerSchema.index({ priority: -1 });
bannerSchema.index({ position: 1 });
bannerSchema.index({ targetAudience: 1 });
bannerSchema.index({ location: '2dsphere' });
bannerSchema.index({ createdBy: 1 });
bannerSchema.index({ applicableRestaurants: 1 });
bannerSchema.index({ applicableCategories: 1 });

// Index for text search
bannerSchema.index({ title: 'text', description: 'text' });

// Virtual for formatted click-through rate
bannerSchema.virtual('formattedCTR').get(function() {
  return `${this.clickThroughRate.toFixed(2)}%`;
});

// Virtual for banner status
bannerSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'scheduled';
  if (now > this.endDate) return 'expired';
  if (!this.isActive) return 'inactive';
  if (this.maxViews > 0 && this.views >= this.maxViews) return 'view_limit_reached';
  if (this.maxClicks > 0 && this.clicks >= this.maxClicks) return 'click_limit_reached';
  return 'active';
});

// Method to record a view
bannerSchema.methods.recordView = async function() {
  this.views += 1;
  await this.save();
  return this;
};

// Method to record a click
bannerSchema.methods.recordClick = async function() {
  this.clicks += 1;
  
  // Update click-through rate
  if (this.views > 0) {
    this.clickThroughRate = (this.clicks / this.views) * 100;
  }
  
  await this.save();
  return this;
};

// Method to check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         now >= this.startDate && 
         now <= this.endDate &&
         (this.maxViews === 0 || this.views < this.maxViews) &&
         (this.maxClicks === 0 || this.clicks < this.maxClicks);
};

// Method to check if banner applies to user location
bannerSchema.methods.appliesToLocation = function(longitude, latitude) {
  if (!this.location || this.location.coordinates[0] === 0) {
    return true; // No location restriction
  }
  
  const distance = Math.sqrt(
    Math.pow(longitude - this.location.coordinates[0], 2) + 
    Math.pow(latitude - this.location.coordinates[1], 2)
  );
  
  // Convert degrees to approximate km
  const distanceInKm = distance * 111;
  
  return distanceInKm <= this.radius;
};

// Static method to get active banners for a location
bannerSchema.statics.getActiveBannersForLocation = async function(longitude, latitude, position = null, limit = 10) {
  const now = new Date();
  const query = {
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
    $or: [
      { location: { $exists: false } },
      { location: { coordinates: [0, 0] } },
      {
        location: {
          $geoWithin: {
            $centerSphere: [[longitude, latitude], 10/6371] // 10km radius in radians
          }
        }
      }
    ]
  };
  
  if (position) {
    query.position = position;
  }
  
  return await this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .populate('applicableRestaurants', 'name image')
    .populate('applicableCategories', 'title')
    .populate('createdBy', 'name email');
};

// Static method to get banners by platform
bannerSchema.statics.getBannersByPlatform = async function(platform, position = null) {
  const now = new Date();
  const query = {
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
    $or: [
      { platforms: { $size: 0 } }, // No platform restriction
      { platforms: platform }
    ]
  };
  
  if (position) {
    query.position = position;
  }
  
  return await this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('applicableRestaurants', 'name image')
    .populate('applicableCategories', 'title');
};

// Static method to get banner analytics
bannerSchema.statics.getBannerAnalytics = async function(bannerId = null, startDate = null, endDate = null) {
  const matchStage = {};
  
  if (bannerId) {
    matchStage._id = mongoose.Types.ObjectId(bannerId);
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBanners: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalClicks: { $sum: '$clicks' },
        averageCTR: { $avg: '$clickThroughRate' },
        activeBanners: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$isActive', true] },
                { $lte: ['$startDate', new Date()] },
                { $gte: ['$endDate', new Date()] }
              ]},
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return analytics.length > 0 ? analytics[0] : {
    totalBanners: 0,
    totalViews: 0,
    totalClicks: 0,
    averageCTR: 0,
    activeBanners: 0
  };
};

// Static method to duplicate banner
bannerSchema.statics.duplicateBanner = async function(bannerId, newTitle, createdBy) {
  const originalBanner = await this.findById(bannerId);
  if (!originalBanner) {
    throw new Error('Banner not found');
  }
  
  const duplicatedBanner = new this({
    title: newTitle || `${originalBanner.title} (Copy)`,
    description: originalBanner.description,
    image: originalBanner.image,
    video: originalBanner.video,
    link: originalBanner.link,
    targetAudience: originalBanner.targetAudience,
    position: originalBanner.position,
    priority: originalBanner.priority,
    variant: 'A',
    platforms: originalBanner.platforms,
    applicableRestaurants: originalBanner.applicableRestaurants,
    applicableCategories: originalBanner.applicableCategories,
    createdBy: createdBy,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });
  
  await duplicatedBanner.save();
  return duplicatedBanner;
};

module.exports = mongoose.model('Banner', bannerSchema);
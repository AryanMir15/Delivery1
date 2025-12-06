const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Geographic boundaries (for Polygon type)
  boundaries: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays of coordinates
      required: true
    }
  },
  // Center point for the zone
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  // Zone settings
  tax: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  deliveryCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumDeliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryDistance: {
    type: Number,
    default: 5, // km
    min: 0
  },
  baseDeliveryFee: {
    type: Number,
    default: 2.0,
    min: 0
  },
  feePerKm: {
    type: Number,
    default: 0.5,
    min: 0
  },
  // Operating hours
  isActive: {
    type: Boolean,
    default: true
  },
  // Zone priority (for overlapping zones)
  priority: {
    type: Number,
    default: 1,
    min: 1
  },
  // Associated restaurants
  restaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }],
  // Zone-specific settings
  settings: {
    allowDelivery: {
      type: Boolean,
      default: true
    },
    allowPickup: {
      type: Boolean,
      default: true
    },
    estimatedDeliveryTime: {
      type: Number,
      default: 30, // minutes
      min: 5
    },
    maximumDeliveryRadius: {
      type: Number,
      default: 10, // km
      min: 1
    },
    // Peak hours and surge pricing
    peakHours: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6 // 0 = Sunday, 6 = Saturday
      },
      startTime: String, // "HH:MM" format
      endTime: String, // "HH:MM" format
      surgeMultiplier: {
        type: Number,
        default: 1.0,
        min: 1.0
      }
    }]
  },
  // Administrative
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

// Indexes for geospatial queries
zoneSchema.index({ location: '2dsphere' });
zoneSchema.index({ boundaries: '2dsphere' });
zoneSchema.index({ isActive: 1 });
zoneSchema.index({ priority: -1 });
zoneSchema.index({ restaurants: 1 });

// Index for text search
zoneSchema.index({ title: 'text', description: 'text' });

// Virtual for formatted delivery fee
zoneSchema.virtual('formattedDeliveryCharges').get(function() {
  return `$${this.deliveryCharges.toFixed(2)}`;
});

// Virtual for center point as latitude/longitude
zoneSchema.virtual('centerLatLng').get(function() {
  if (this.location && this.location.coordinates) {
    return {
      latitude: this.location.coordinates[1],
      longitude: this.location.coordinates[0]
    };
  }
  return null;
});

// Method to check if coordinates are within zone
zoneSchema.methods.containsPoint = function(longitude, latitude) {
  // Simplified point-in-polygon check
  // In production, use a proper geospatial library
  const point = [longitude, latitude];
  
  // For now, just check distance from center
  const center = this.location.coordinates;
  const distance = Math.sqrt(
    Math.pow(point[0] - center[0], 2) + 
    Math.pow(point[1] - center[1], 2)
  );
  
  // Convert degrees to approximate km (rough approximation)
  const distanceInKm = distance * 111; // 1 degree ≈ 111 km
  
  return distanceInKm <= this.deliveryDistance;
};

// Method to calculate delivery fee based on distance
zoneSchema.methods.calculateDeliveryFee = function(distance) {
  let fee = this.baseDeliveryFee;
  
  if (distance > this.minimumDeliveryFee) {
    fee += (distance - this.minimumDeliveryFee) * this.feePerKm;
  }
  
  // Check for peak hours
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const peakHour = this.settings.peakHours.find(peak => 
    peak.dayOfWeek === dayOfWeek && 
    currentTime >= peak.startTime && 
    currentTime <= peak.endTime
  );
  
  if (peakHour) {
    fee *= peakHour.surgeMultiplier;
  }
  
  return Math.max(fee, this.minimumDeliveryFee);
};

// Method to add restaurant to zone
zoneSchema.methods.addRestaurant = async function(restaurantId) {
  if (!this.restaurants.includes(restaurantId)) {
    this.restaurants.push(restaurantId);
    await this.save();
  }
  return this;
};

// Method to remove restaurant from zone
zoneSchema.methods.removeRestaurant = async function(restaurantId) {
  this.restaurants = this.restaurants.filter(id => !id.equals(restaurantId));
  await this.save();
  return this;
};

// Static method to find zone for coordinates
zoneSchema.statics.findZoneForLocation = async function(longitude, latitude) {
  const zones = await this.find({ isActive: true }).sort({ priority: -1 });
  
  for (const zone of zones) {
    if (zone.containsPoint(longitude, latitude)) {
      return zone;
    }
  }
  
  return null;
};

// Static method to get zones with restaurant count
zoneSchema.statics.getZonesWithRestaurantCount = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: 'zone',
        as: 'restaurantsData'
      }
    },
    {
      $addFields: {
        restaurantCount: { $size: '$restaurantsData' },
        activeRestaurantCount: {
          $size: {
            $filter: {
              input: '$restaurantsData',
              cond: { $eq: ['$$this.isActive', true] }
            }
          }
        }
      }
    },
    {
      $project: {
        restaurantsData: 0 // Don't include restaurant data in results
      }
    },
    { $sort: { priority: -1, createdAt: -1 } }
  ]);
};

// Static method to get delivery zones for a restaurant
zoneSchema.statics.getZonesForRestaurant = async function(restaurantId) {
  return await this.find({
    restaurants: restaurantId,
    isActive: true
  }).sort({ priority: -1 });
};

// Static method to calculate delivery statistics
zoneSchema.statics.getDeliveryStats = async function(zoneId = null, startDate = null, endDate = null) {
  const matchStage = {};
  
  if (zoneId) {
    matchStage.zone = mongoose.Types.ObjectId(zoneId);
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  // This would need to be joined with Order model
  // For now, return basic zone stats
  const zoneStats = await this.aggregate([
    ...(zoneId ? [{ $match: { _id: mongoose.Types.ObjectId(zoneId) } }] : [{ $match: { isActive: true } }]),
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: 'zone',
        as: 'restaurants'
      }
    },
    {
      $addFields: {
        totalRestaurants: { $size: '$restaurants' },
        activeRestaurants: {
          $size: {
            $filter: {
              input: '$restaurants',
              cond: { $eq: ['$$this.isActive', true] }
            }
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalZones: { $sum: 1 },
        avgDeliveryFee: { $avg: '$deliveryCharges' },
        totalRestaurants: { $sum: '$totalRestaurants' },
        totalActiveRestaurants: { $sum: '$activeRestaurants' }
      }
    }
  ]);
  
  return zoneStats.length > 0 ? zoneStats[0] : {
    totalZones: 0,
    avgDeliveryFee: 0,
    totalRestaurants: 0,
    totalActiveRestaurants: 0
  };
};

module.exports = mongoose.model('Zone', zoneSchema);
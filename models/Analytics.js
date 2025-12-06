const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  metric: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  previousValue: {
    type: Number,
    default: 0
  },
  change: {
    type: Number,
    default: 0
  },
  changePercent: {
    type: Number,
    default: 0
  },
  // Dimensions
  dimension: {
    type: String,
    enum: [
      'daily', 'weekly', 'monthly', 'quarterly', 'yearly',
      'by_restaurant', 'by_rider', 'by_user', 'by_location',
      'by_cuisine', 'by_order_type', 'by_payment_method'
    ],
    required: true
  },
  dimensionValue: {
    type: String
  },
  // Time period
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  // Related entities
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Calculation details
  calculationMethod: {
    type: String,
    enum: ['sum', 'average', 'count', 'percentage', 'ratio'],
    default: 'sum'
  },
  isRealTime: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
analyticsSchema.index({ metric: 1, dimension: 1, 'period.start': -1 });
analyticsSchema.index({ restaurant: 1, 'period.start': -1 });
analyticsSchema.index({ rider: 1, 'period.start': -1 });
analyticsSchema.index({ user: 1, 'period.start': -1 });
analyticsSchema.index({ 'period.start': -1, 'period.end': -1 });
analyticsSchema.index({ dimension: 1, dimensionValue: 1 });
analyticsSchema.index({ isRealTime: 1, lastUpdated: -1 });

// Pre-save middleware to calculate change
analyticsSchema.pre('save', function(next) {
  if (this.isNew && this.previousValue > 0) {
    this.change = this.value - this.previousValue;
    this.changePercent = (this.change / this.previousValue) * 100;
  }
  this.lastUpdated = new Date();
  next();
});

// Static method to record metric
analyticsSchema.statics.recordMetric = async function(metric, value, dimension, options = {}) {
  const {
    dimensionValue = null,
    restaurant = null,
    rider = null,
    user = null,
    location = null,
    period = null,
    metadata = {},
    calculationMethod = 'sum'
  } = options;
  
  // Default period to current day
  const now = new Date();
  const periodStart = period?.start || new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodEnd = period?.end || new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  
  // Try to find existing record
  const existing = await this.findOne({
    metric,
    dimension,
    dimensionValue,
    restaurant,
    rider,
    user,
    'period.start': periodStart,
    'period.end': periodEnd
  });
  
  if (existing) {
    // Update existing record
    existing.value = calculationMethod === 'count' ? existing.value + 1 : value;
    existing.metadata = { ...existing.metadata, ...metadata };
    existing.lastUpdated = new Date();
    await existing.save();
    return existing;
  } else {
    // Create new record
    const analytics = new this({
      metric,
      value: calculationMethod === 'count' ? 1 : value,
      dimension,
      dimensionValue,
      restaurant,
      rider,
      user,
      location,
      period: { start: periodStart, end: periodEnd },
      metadata,
      calculationMethod
    });
    
    await analytics.save();
    return analytics;
  }
};

// Static method to get dashboard overview
analyticsSchema.statics.getDashboardOverview = async function(startDate, endDate) {
  const matchStage = {
    'period.start': { $gte: new Date(startDate) },
    'period.end': { $lte: new Date(endDate) }
  };
  
  const overview = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$metric',
        currentValue: { $sum: '$value' },
        records: { $sum: 1 }
      }
    }
  ]);
  
  // Define key metrics for the dashboard
  const keyMetrics = [
    'total_orders',
    'total_revenue',
    'active_restaurants',
    'active_riders',
    'total_users',
    'average_order_value',
    'delivery_success_rate',
    'customer_satisfaction'
  ];
  
  const result = {};
  
  keyMetrics.forEach(metric => {
    const metricData = overview.find(item => item._id === metric);
    result[metric] = {
      value: metricData ? metricData.currentValue : 0,
      records: metricData ? metricData.records : 0,
      trend: 'stable' // Would need historical data to calculate
    };
  });
  
  return result;
};

// Static method to get time series data
analyticsSchema.statics.getTimeSeriesData = async function(metric, dimension, startDate, endDate, interval = 'daily') {
  const matchStage = {
    metric,
    dimension,
    'period.start': { $gte: new Date(startDate) },
    'period.end': { $lte: new Date(endDate) }
  };
  
  const data = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$period.start' },
          month: { $month: '$period.start' },
          day: { $dayOfMonth: '$period.start' }
        },
        value: { $sum: '$value' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  return data.map(item => ({
    date: new Date(item._id.year, item._id.month - 1, item._id.day),
    value: item.value,
    count: item.count
  }));
};

// Static method to get top performers
analyticsSchema.statics.getTopPerformers = async function(metric, dimension, startDate, endDate, limit = 10) {
  const matchStage = {
    metric,
    dimension,
    'period.start': { $gte: new Date(startDate) },
    'period.end': { $lte: new Date(endDate) }
  };
  
  const data = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$dimensionValue',
        totalValue: { $sum: '$value' },
        records: { $sum: 1 }
      }
    },
    { $sort: { totalValue: -1 } },
    { $limit: limit }
  ]);
  
  return data;
};

// Static method to get location-based analytics
analyticsSchema.statics.getLocationAnalytics = async function(longitude, latitude, radius = 10, startDate, endDate) {
  const matchStage = {
    'period.start': { $gte: new Date(startDate) },
    'period.end': { $lte: new Date(endDate) },
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  };
  
  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          metric: '$metric',
          dimension: '$dimension'
        },
        totalValue: { $sum: '$value' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return analytics;
};

// Static method to get restaurant performance
analyticsSchema.statics.getRestaurantPerformance = async function(restaurantId, startDate, endDate) {
  const matchStage = {
    restaurant: mongoose.Types.ObjectId(restaurantId),
    'period.start': { $gte: new Date(startDate) },
    'period.end': { $lte: new Date(endDate) }
  };
  
  const performance = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$metric',
        value: { $sum: '$value' },
        records: { $sum: 1 }
      }
    }
  ]);
  
  // Calculate derived metrics
  const totalOrders = performance.find(p => p._id === 'total_orders')?.value || 0;
  const totalRevenue = performance.find(p => p._id === 'total_revenue')?.value || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    rawMetrics: performance
  };
};

// Static method to get rider analytics
analyticsSchema.statics.getRiderAnalytics = async function(riderId, startDate, endDate) {
  const matchStage = {
    rider: mongoose.Types.ObjectId(riderId),
    'period.start': { $gte: new Date(startDate) },
    'period.end': { $lte: new Date(endDate) }
  };
  
  const analytics = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$metric',
        value: { $sum: '$value' },
        records: { $sum: 1 }
      }
    }
  ]);
  
  return analytics;
};

// Static method to get real-time statistics
analyticsSchema.statics.getRealTimeStats = async function() {
  const stats = await this.aggregate([
    { $match: { isRealTime: true } },
    {
      $group: {
        _id: '$metric',
        value: { $sum: '$value' },
        lastUpdated: { $max: '$lastUpdated' }
      }
    }
  ]);
  
  const result = {};
  stats.forEach(stat => {
    result[stat._id] = {
      value: stat.value,
      lastUpdated: stat.lastUpdated
    };
  });
  
  return result;
};

// Static method to clean up old analytics data
analyticsSchema.statics.cleanupOldData = async function(daysToKeep = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await this.deleteMany({
    'period.end': { $lt: cutoffDate },
    isRealTime: false
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
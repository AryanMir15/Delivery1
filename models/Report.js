const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'sales', 'orders', 'financial', 'restaurant_performance', 
      'rider_performance', 'user_analytics', 'delivery_analytics',
      'commission_report', 'withdrawal_report', 'custom'
    ],
    required: true
  },
  // Report configuration
  config: {
    // Data source
    dataSource: {
      type: String,
      enum: ['orders', 'restaurants', 'riders', 'users', 'transactions', 'earnings'],
      required: true
    },
    // Filters
    filters: [{
      field: String,
      operator: {
        type: String,
        enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'regex']
      },
      value: mongoose.Schema.Types.Mixed
    }],
    // Date range
    dateRange: {
      field: {
        type: String,
        enum: ['createdAt', 'updatedAt', 'orderDate', 'deliveryDate'],
        default: 'createdAt'
      },
      startDate: Date,
      endDate: Date,
      preset: {
        type: String,
        enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'custom']
      }
    },
    // Grouping
    groupBy: [{
      field: String,
      interval: {
        type: String,
        enum: ['hour', 'day', 'week', 'month', 'quarter', 'year']
      }
    }],
    // Aggregations
    aggregations: [{
      field: String,
      operation: {
        type: String,
        enum: ['sum', 'avg', 'count', 'min', 'max', 'distinct_count']
      },
      alias: String
    }],
    // Sorting
    sortBy: [{
      field: String,
      order: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'desc'
      }
    }],
    // Limits
    limit: {
      type: Number,
      default: 1000,
      max: 10000
    }
  },
  // Scheduling
  schedule: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly']
    },
    time: String, // HH:MM format
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    timezone: {
      type: String,
      default: 'UTC'
    },
    recipients: [{
      email: String,
      format: {
        type: String,
        enum: ['pdf', 'csv', 'excel', 'json'],
        default: 'pdf'
      }
    }],
    lastRun: Date,
    nextRun: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // Access control
  access: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    allowedRoles: [{
      type: String,
      enum: ['admin', 'restaurant', 'vendor', 'rider']
    }]
  },
  // Results cache
  cached: {
    enabled: {
      type: Boolean,
      default: true
    },
    ttl: {
      type: Number,
      default: 3600, // 1 hour in seconds
      min: 300 // minimum 5 minutes
    },
    lastCached: Date,
    cacheKey: String
  },
  // Execution status
  status: {
    type: String,
    enum: ['draft', 'active', 'running', 'error', 'disabled'],
    default: 'draft'
  },
  lastExecuted: Date,
  executionCount: {
    type: Number,
    default: 0
  },
  averageExecutionTime: {
    type: Number,
    default: 0
  },
  // Creator and ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      view: { type: Boolean, default: true },
      edit: { type: Boolean, default: false },
      execute: { type: Boolean, default: true }
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Report template
  template: {
    type: String,
    enum: ['table', 'chart', 'pivot', 'dashboard', 'summary'],
    default: 'table'
  },
  visualization: {
    chartType: {
      type: String,
      enum: ['line', 'bar', 'pie', 'doughnut', 'area', 'scatter', 'radar']
    },
    colors: [String],
    showLegend: {
      type: Boolean,
      default: true
    },
    showDataLabels: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
reportSchema.index({ createdBy: 1, createdAt: -1 });
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ 'schedule.nextRun': 1 });
reportSchema.index({ 'schedule.enabled': 1, 'schedule.isActive': 1 });
reportSchema.index({ 'access.allowedUsers': 1 });
reportSchema.index({ sharedWith: 1 });

// Virtual for last execution time
reportSchema.virtual('lastExecutionTime').get(function() {
  if (this.lastExecuted) {
    return `${this.averageExecutionTime.toFixed(2)}s`;
  }
  return 'Never';
});

// Method to check if user can access report
reportSchema.methods.canUserAccess = function(userId, userRole) {
  // Public reports
  if (this.access.isPublic) return true;
  
  // Creator can always access
  if (this.createdBy.toString() === userId.toString()) return true;
  
  // Check explicit user permissions
  if (this.access.allowedUsers.some(user => user.toString() === userId.toString())) return true;
  
  // Check role permissions
  if (this.access.allowedRoles.includes(userRole)) return true;
  
  // Check shared permissions
  const sharedWith = this.sharedWith.find(share => share.user.toString() === userId.toString());
  return sharedWith && sharedWith.permissions.view;
};

// Method to check if user can edit report
reportSchema.methods.canUserEdit = function(userId) {
  // Creator can always edit
  if (this.createdBy.toString() === userId.toString()) return true;
  
  // Check shared edit permissions
  const sharedWith = this.sharedWith.find(share => share.user.toString() === userId.toString());
  return sharedWith && sharedWith.permissions.edit;
};

// Method to execute report
reportSchema.methods.execute = async function() {
  if (this.status === 'running') {
    throw new Error('Report is already running');
  }
  
  this.status = 'running';
  await this.save();
  
  const startTime = Date.now();
  
  try {
    const results = await this.runQuery();
    
    // Update execution stats
    const executionTime = (Date.now() - startTime) / 1000;
    this.lastExecuted = new Date();
    this.executionCount += 1;
    this.averageExecutionTime = ((this.averageExecutionTime * (this.executionCount - 1)) + executionTime) / this.executionCount;
    
    // Update cache if enabled
    if (this.cached.enabled) {
      await this.updateCache(results);
    }
    
    this.status = 'active';
    await this.save();
    
    return results;
  } catch (error) {
    this.status = 'error';
    await this.save();
    throw error;
  }
};

// Method to run the actual query
reportSchema.methods.runQuery = async function() {
  // This would integrate with the actual data source
  // For now, return a placeholder implementation
  const { dataSource, filters, dateRange, groupBy, aggregations, sortBy, limit } = this.config;
  
  // Build MongoDB aggregation pipeline based on configuration
  const pipeline = [];
  
  // Add filters
  if (filters.length > 0) {
    const matchConditions = {};
    filters.forEach(filter => {
      const { field, operator, value } = filter;
      
      switch (operator) {
        case 'eq':
          matchConditions[field] = value;
          break;
        case 'ne':
          matchConditions[field] = { $ne: value };
          break;
        case 'gt':
          matchConditions[field] = { $gt: value };
          break;
        case 'gte':
          matchConditions[field] = { $gte: value };
          break;
        case 'lt':
          matchConditions[field] = { $lt: value };
          break;
        case 'lte':
          matchConditions[field] = { $lte: value };
          break;
        case 'in':
          matchConditions[field] = { $in: Array.isArray(value) ? value : [value] };
          break;
        case 'nin':
          matchConditions[field] = { $nin: Array.isArray(value) ? value : [value] };
          break;
        case 'regex':
          matchConditions[field] = { $regex: value, $options: 'i' };
          break;
      }
    });
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
  }
  
  // Add date range filter
  if (dateRange.startDate && dateRange.endDate) {
    const dateFilter = {};
    dateFilter[dateRange.field] = {
      $gte: new Date(dateRange.startDate),
      $lte: new Date(dateRange.endDate)
    };
    pipeline.push({ $match: dateFilter });
  }
  
  // Add grouping
  if (groupBy.length > 0) {
    const groupId = {};
    const groupFields = {};
    
    groupBy.forEach(group => {
      if (group.interval) {
        // Handle time-based grouping
        switch (group.interval) {
          case 'hour':
            groupId[group.field] = { $hour: `$${group.field}` };
            break;
          case 'day':
            groupId[group.field] = { $dayOfMonth: `$${group.field}` };
            break;
          case 'week':
            groupId[group.field] = { $week: `$${group.field}` };
            break;
          case 'month':
            groupId[group.field] = { $month: `$${group.field}` };
            break;
          case 'quarter':
            groupId[group.field] = { $quarter: `$${group.field}` };
            break;
          case 'year':
            groupId[group.field] = { $year: `$${group.field}` };
            break;
        }
      } else {
        groupId[group.field] = `$${group.field}`;
      }
    });
    
    pipeline.push({ $group: { _id: groupId } });
    
    // Add aggregations
    if (aggregations.length > 0) {
      aggregations.forEach(agg => {
        const fieldPath = `$${agg.field}`;
        let operation;
        
        switch (agg.operation) {
          case 'sum':
            operation = { $sum: fieldPath };
            break;
          case 'avg':
            operation = { $avg: fieldPath };
            break;
          case 'count':
            operation = { $sum: 1 };
            break;
          case 'min':
            operation = { $min: fieldPath };
            break;
          case 'max':
            operation = { $max: fieldPath };
            break;
          case 'distinct_count':
            operation = { $addToSet: fieldPath };
            break;
        }
        
        const alias = agg.alias || `${agg.operation}_${agg.field}`;
        groupFields[alias] = operation;
      });
      
      pipeline[pipeline.length - 1] = { 
        $group: { 
          _id: pipeline[pipeline.length - 1].$group._id,
          ...groupFields 
        } 
      };
    }
  }
  
  // Add sorting
  if (sortBy.length > 0) {
    const sortObj = {};
    sortBy.forEach(sort => {
      sortObj[sort.field] = sort.order === 'desc' ? -1 : 1;
    });
    pipeline.push({ $sort: sortObj });
  }
  
  // Add limit
  if (limit) {
    pipeline.push({ $limit: limit });
  }
  
  // Execute the query (placeholder - would use actual model)
  return { 
    data: [], 
    total: 0, 
    pipeline: pipeline,
    executedAt: new Date() 
  };
};

// Method to update cache
reportSchema.methods.updateCache = async function(results) {
  const { cached } = this;
  
  // Generate cache key
  const configHash = JSON.stringify(this.config);
  const cacheKey = `report_${this._id}_${Buffer.from(configHash).toString('base64').slice(0, 16)}`;
  
  this.cached.cacheKey = cacheKey;
  this.cached.lastCached = new Date();
  
  // In a real implementation, you would store results in Redis or similar
  // For now, just update the cache metadata
  await this.save();
};

// Static method to get reports for user
reportSchema.statics.getReportsForUser = async function(userId, userRole, type = null) {
  const query = {
    $or: [
      { createdBy: userId },
      { 'access.isPublic': true },
      { 'access.allowedUsers': userId },
      { 'access.allowedRoles': userRole },
      { 'sharedWith.user': userId }
    ]
  };
  
  if (type) {
    query.type = type;
  }
  
  return await this.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get scheduled reports
reportSchema.statics.getScheduledReports = async function() {
  return await this.find({
    'schedule.enabled': true,
    'schedule.isActive': true,
    'schedule.nextRun': { $lte: new Date() },
    status: { $in: ['active', 'draft'] }
  });
};

module.exports = mongoose.model('Report', reportSchema);
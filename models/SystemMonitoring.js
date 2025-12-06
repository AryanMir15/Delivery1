const mongoose = require('mongoose');

const systemMetricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['ms', 's', 'bytes', 'KB', 'MB', 'GB', 'TB', 'count', 'percentage', 'rps', 'qps'],
    default: 'count'
  },
  type: {
    type: String,
    enum: ['gauge', 'counter', 'histogram', 'timer'],
    default: 'gauge'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  tags: {
    type: Map,
    of: String
  },
  source: {
    type: String,
    enum: ['application', 'database', 'cache', 'external_api', 'filesystem', 'network'],
    required: true
  }
}, {
  timestamps: true
});

const alertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  metric: {
    type: String,
    required: true
  },
  condition: {
    operator: {
      type: String,
      enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      default: 60 // seconds
    }
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'warning'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notifications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'webhook', 'slack', 'discord']
    },
    target: String,
    isEnabled: {
      type: Boolean,
      default: true
    }
  }],
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedAt: Date
}, {
  timestamps: true
});

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['api', 'database', 'cache', 'queue', 'storage', 'external'],
    required: true
  },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'down', 'maintenance'],
    default: 'healthy'
  },
  url: String,
  lastCheck: Date,
  uptime: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  responseTime: {
    current: Number,
    average: Number,
    p95: Number,
    p99: Number
  },
  errorRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  throughput: {
    current: Number, // requests per second
    average: Number
  },
  dependencies: [{
    service: String,
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down']
    },
    lastChecked: Date
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for system metrics
systemMetricSchema.index({ name: 1, timestamp: -1 });
systemMetricSchema.index({ source: 1, timestamp: -1 });
systemMetricSchema.index({ timestamp: -1 });
systemMetricSchema.index({ tags: 1 });

// Indexes for alerts
alertSchema.index({ metric: 1, isActive: 1 });
alertSchema.index({ severity: 1, isActive: 1 });
alertSchema.index({ lastTriggered: -1 });

// Indexes for services
serviceSchema.index({ status: 1 });
serviceSchema.index({ type: 1, status: 1 });

// Virtual for formatted uptime
serviceSchema.virtual('formattedUptime').get(function() {
  return `${this.uptime.toFixed(2)}%`;
});

// Virtual for formatted response time
serviceSchema.virtual('formattedResponseTime').get(function() {
  if (this.responseTime.current) {
    return `${this.responseTime.current.toFixed(2)}ms`;
  }
  return 'N/A';
});

// Method to update service status
serviceSchema.methods.updateStatus = async function(status, metadata = {}) {
  this.status = status;
  this.metadata = { ...this.metadata, ...metadata };
  await this.save();
  return this;
};

// Method to record health check
serviceSchema.methods.recordHealthCheck = async function(result) {
  this.lastCheck = new Date();
  
  if (result.success) {
    this.status = 'healthy';
    this.responseTime.current = result.responseTime;
  } else {
    this.status = 'down';
    this.errorRate += 1;
  }
  
  // Update averages
  if (this.responseTime.current && result.responseTime) {
    this.responseTime.average = this.responseTime.average 
      ? (this.responseTime.average + result.responseTime) / 2
      : result.responseTime;
  }
  
  await this.save();
  return this;
};

// Static method to get system overview
serviceSchema.statics.getSystemOverview = async function() {
  const services = await this.find();
  const totalServices = services.length;
  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const degradedServices = services.filter(s => s.status === 'degraded').length;
  const downServices = services.filter(s => s.status === 'down').length;
  
  const avgUptime = totalServices > 0 
    ? services.reduce((sum, s) => sum + s.uptime, 0) / totalServices 
    : 0;
  
  const avgResponseTime = services
    .filter(s => s.responseTime.current)
    .reduce((sum, s, _, arr) => sum + s.responseTime.current / arr.length, 0);
  
  return {
    totalServices,
    healthyServices,
    degradedServices,
    downServices,
    systemHealth: totalServices > 0 ? (healthyServices / totalServices) * 100 : 0,
    avgUptime,
    avgResponseTime
  };
};

// Static method to get service metrics for a time range
systemMetricSchema.statics.getMetricsRange = async function(metricName, startDate, endDate, interval = 'hour') {
  const matchStage = {
    name: metricName,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  // Determine date format based on interval
  let dateFormat;
  switch (interval) {
    case 'minute':
      dateFormat = '%Y-%m-%d %H:%M';
      break;
    case 'hour':
      dateFormat = '%Y-%m-%d %H:00';
      break;
    case 'day':
      dateFormat = '%Y-%m-%d';
      break;
    case 'week':
      dateFormat = '%Y-W%V';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      break;
    default:
      dateFormat = '%Y-%m-%d';
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          timestamp: {
            $dateToString: {
              format: dateFormat,
              date: '$timestamp'
            }
          }
        },
        value: { $avg: '$value' },
        count: { $sum: 1 },
        min: { $min: '$value' },
        max: { $max: '$value' }
      }
    },
    { $sort: { '_id.timestamp': 1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to check alerts
alertSchema.statics.checkAlerts = async function() {
  const activeAlerts = await this.find({ isActive: true });
  const triggeredAlerts = [];
  
  for (const alert of activeAlerts) {
    try {
      // Get recent metrics for the alert
      const cutoffTime = new Date();
      cutoffTime.setSeconds(cutoffTime.getSeconds() - alert.condition.duration);
      
      const metrics = await systemMetricSchema.aggregate([
        {
          $match: {
            name: alert.metric,
            timestamp: { $gte: cutoffTime }
          }
        },
        {
          $group: {
            _id: null,
            avgValue: { $avg: '$value' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      if (metrics.length === 0) continue;
      
      const avgValue = metrics[0].avgValue;
      let shouldTrigger = false;
      
      // Check condition
      switch (alert.condition.operator) {
        case 'gt':
          shouldTrigger = avgValue > alert.condition.threshold;
          break;
        case 'gte':
          shouldTrigger = avgValue >= alert.condition.threshold;
          break;
        case 'lt':
          shouldTrigger = avgValue < alert.condition.threshold;
          break;
        case 'lte':
          shouldTrigger = avgValue <= alert.condition.threshold;
          break;
        case 'eq':
          shouldTrigger = avgValue === alert.condition.threshold;
          break;
        case 'ne':
          shouldTrigger = avgValue !== alert.condition.threshold;
          break;
      }
      
      if (shouldTrigger && (!alert.lastTriggered || 
          Date.now() - alert.lastTriggered.getTime() > 300000)) { // 5 minutes cooldown
        triggeredAlerts.push(alert);
      }
    } catch (error) {
      console.error(`Error checking alert ${alert.name}:`, error);
    }
  }
  
  return triggeredAlerts;
};

// Static method to get performance metrics
systemMetricSchema.statics.getPerformanceMetrics = async function(startDate, endDate) {
  const metrics = await this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        source: { $in: ['application', 'database', 'cache'] }
      }
    },
    {
      $group: {
        _id: {
          name: '$name',
          source: '$source'
        },
        avgValue: { $avg: '$value' },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return metrics;
};

// Static method to get error rates
systemMetricSchema.statics.getErrorRates = async function(startDate, endDate) {
  const errors = await this.aggregate([
    {
      $match: {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        name: { $regex: /error/i }
      }
    },
    {
      $group: {
        _id: {
          source: '$source',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          }
        },
        errorCount: { $sum: '$value' }
      }
    },
    { $sort: { '_id.date': -1 } }
  ]);
  
  return errors;
};

const SystemMonitoringSchema = new mongoose.Schema({
  // System metrics
  metrics: [systemMetricSchema],
  // Alerts
  alerts: [alertSchema],
  // Services
  services: [serviceSchema],
  // System configuration
  config: {
    monitoring: {
      enabled: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 60 // seconds
      },
      retention: {
        type: Number,
        default: 30 // days
      }
    },
    alerting: {
      enabled: {
        type: Boolean,
        default: true
      },
      escalation: {
        enabled: {
          type: Boolean,
          default: false
        },
        levels: [{
          level: Number,
          delay: Number // minutes
        }]
      }
    },
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        smtp: {
          host: String,
          port: Number,
          username: String,
          password: String
        }
      },
      webhook: {
        enabled: {
          type: Boolean,
          default: false
        },
        urls: [String]
      }
    }
  },
  // Last maintenance
  lastMaintenance: Date,
  // System health score
  healthScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Static method to record metric
SystemMonitoringSchema.statics.recordMetric = async function(name, value, unit, source, tags = {}) {
  const metric = new systemMetricSchema({
    name,
    value,
    unit,
    source,
    tags,
    timestamp: new Date()
  });
  
  await metric.save();
  return metric;
};

// Static method to create service
SystemMonitoringSchema.statics.createService = async function(name, type, url = null) {
  let monitoring = await this.findOne();
  
  if (!monitoring) {
    monitoring = new this({});
  }
  
  const existingService = monitoring.services.find(s => s.name === name);
  if (existingService) {
    throw new Error('Service already exists');
  }
  
  const newService = new serviceSchema({
    name,
    type,
    url
  });
  
  monitoring.services.push(newService);
  await monitoring.save();
  
  return newService;
};

// Static method to get health dashboard data
SystemMonitoringSchema.statics.getHealthDashboard = async function() {
  const overview = await serviceSchema.statics.getSystemOverview();
  const recentMetrics = await systemMetricSchema.find()
    .sort({ timestamp: -1 })
    .limit(100);
  
  const alerts = await alertSchema.find({ isActive: true })
    .sort({ severity: -1, lastTriggered: -1 });
  
  const performanceMetrics = await systemMetricSchema.statics.getPerformanceMetrics(
    new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    new Date()
  );
  
  return {
    overview,
    recentMetrics,
    activeAlerts: alerts,
    performanceMetrics,
    systemStatus: overview.systemHealth > 95 ? 'healthy' : 
                  overview.systemHealth > 80 ? 'degraded' : 'critical'
  };
};

module.exports = mongoose.model('SystemMonitoring', SystemMonitoringSchema);
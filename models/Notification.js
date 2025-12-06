const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'order_update', 'payment', 'promotion', 'system', 'chat', 
      'review', 'coupon', 'delivery', 'restaurant', 'rider', 'support'
    ],
    required: true
  },
  category: {
    type: String,
    enum: [
      'order', 'payment', 'marketing', 'system', 'social', 
      'account', 'restaurant', 'delivery', 'promotional'
    ],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  // Action and data
  actionUrl: String,
  actionType: {
    type: String,
    enum: ['none', 'view_order', 'view_restaurant', 'view_profile', 'open_chat', 'make_payment', 'redeem_coupon']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  referenceType: {
    type: String,
    enum: ['order', 'restaurant', 'user', 'coupon', 'review', 'support_ticket']
  },
  // Delivery channels
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app', 'web_push']
  }],
  deliveryStatus: {
    push: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      error: String
    },
    email: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      error: String,
      messageId: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      error: String,
      messageId: String
    },
    web_push: {
      sent: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      failed: { type: Boolean, default: false },
      sentAt: Date,
      deliveredAt: Date,
      error: String
    }
  },
  // Scheduling
  scheduledAt: Date,
  expiresAt: Date,
  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'video', 'audio']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  // Template and localization
  templateId: String,
  language: {
    type: String,
    default: 'en'
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Analytics
  clicks: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  },
  clickThroughRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, isArchived: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ referenceId: 1, referenceType: 1 });
notificationSchema.index({ createdAt: -1 });

// Index for text search
notificationSchema.index({ title: 'text', message: 'text' });

// Virtual for formatted click-through rate
notificationSchema.virtual('formattedCTR').get(function() {
  return `${this.clickThroughRate.toFixed(2)}%`;
});

// Virtual for notification status
notificationSchema.virtual('status').get(function() {
  if (this.isArchived) return 'archived';
  if (this.expiresAt && this.expiresAt < new Date()) return 'expired';
  return 'active';
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  await this.save();
  return this;
};

// Method to archive notification
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
  return this;
};

// Method to unarchive notification
notificationSchema.methods.unarchive = async function() {
  this.isArchived = false;
  this.archivedAt = null;
  await this.save();
  return this;
};

// Method to record a click
notificationSchema.methods.recordClick = async function() {
  this.clicks += 1;
  
  // Update click-through rate
  if (this.impressions > 0) {
    this.clickThroughRate = (this.clicks / this.impressions) * 100;
  }
  
  await this.save();
  return this;
};

// Method to record an impression
notificationSchema.methods.recordImpression = async function() {
  this.impressions += 1;
  
  // Update click-through rate
  if (this.clicks > 0) {
    this.clickThroughRate = (this.clicks / this.impressions) * 100;
  }
  
  await this.save();
  return this;
};

// Method to check if notification is currently active
notificationSchema.methods.isActive = function() {
  const now = new Date();
  return !this.isArchived && 
         (!this.expiresAt || this.expiresAt > now) &&
         (!this.scheduledAt || this.scheduledAt <= now);
};

// Static method to get notifications for user
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    unreadOnly = false,
    archived = false,
    type = null,
    priority = null
  } = options;
  
  const query = { recipient: userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (!archived) {
    query.isArchived = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (priority) {
    query.priority = priority;
  }
  
  return await this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name profileImage')
    .populate('referenceId', null, null, { lean: true });
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId, type = null) {
  const query = { 
    recipient: userId, 
    isRead: false, 
    isArchived: false 
  };
  
  if (type) {
    query.type = type;
  }
  
  // Check expiration
  query.$or = [
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ];
  
  return await this.countDocuments(query);
};

// Static method to get notification statistics
notificationSchema.statics.getStatistics = async function(userId = null, startDate = null, endDate = null) {
  const matchStage = {};
  
  if (userId) {
    matchStage.recipient = mongoose.Types.ObjectId(userId);
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        unreadCount: {
          $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
        },
        totalClicks: { $sum: '$clicks' },
        totalImpressions: { $sum: '$impressions' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    unread: 0,
    byType: {},
    totalClicks: 0,
    totalImpressions: 0,
    overallCTR: 0
  };
  
  let totalClicks = 0;
  let totalImpressions = 0;
  
  stats.forEach(stat => {
    result.total += stat.count;
    result.unread += stat.unreadCount;
    totalClicks += stat.totalClicks;
    totalImpressions += stat.totalImpressions;
    
    result.byType[stat._id] = {
      count: stat.count,
      unread: stat.unreadCount,
      clicks: stat.totalClicks,
      impressions: stat.totalImpressions,
      ctr: stat.totalImpressions > 0 
        ? (stat.totalClicks / stat.totalImpressions) * 100 
        : 0
    };
  });
  
  result.totalClicks = totalClicks;
  result.totalImpressions = totalImpressions;
  result.overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  
  return result;
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulkNotifications = async function(notifications) {
  const results = [];
  
  for (const notificationData of notifications) {
    try {
      const notification = new this(notificationData);
      await notification.save();
      results.push({ success: true, notification });
    } catch (error) {
      results.push({ success: false, error: error.message, data: notificationData });
    }
  }
  
  return results;
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    { 
      expiresAt: { $lt: new Date() },
      isArchived: false 
    },
    { isArchived: true, archivedAt: new Date() }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('Notification', notificationSchema);
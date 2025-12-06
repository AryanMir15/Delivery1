const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimeType: String
  }],
  isInternal: {
    type: Boolean,
    default: false // true for admin-only notes
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  }
}, {
  timestamps: true
});

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'technical', 'billing', 'order_issue', 'restaurant_complaint',
      'rider_issue', 'account', 'feature_request', 'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin/support staff
  },
  // Related entities
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  // Resolution information
  resolution: {
    summary: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  // SLA tracking
  slaDeadline: Date,
  firstResponseAt: Date,
  // Metadata
  tags: [String],
  source: {
    type: String,
    enum: ['web', 'mobile', 'email', 'chat', 'phone'],
    default: 'web'
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  escalatedTo: {
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
supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ ticketId: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ assignedTo: 1 });
supportTicketSchema.index({ relatedOrder: 1 });
supportTicketSchema.index({ relatedRestaurant: 1 });
supportTicketSchema.index({ slaDeadline: 1 });
supportTicketSchema.index({ tags: 1 });

// Pre-save middleware to generate ticket ID
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketId) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Set SLA deadline based on priority
  if (this.isNew || this.isModified('priority')) {
    const now = new Date();
    let slaHours = 24; // default 24 hours
    
    switch (this.priority) {
      case 'urgent':
        slaHours = 4;
        break;
      case 'high':
        slaHours = 8;
        break;
      case 'medium':
        slaHours = 24;
        break;
      case 'low':
        slaHours = 48;
        break;
    }
    
    this.slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
  }
  
  next();
});

// Virtual for formatted ticket ID
supportTicketSchema.virtual('formattedTicketId').get(function() {
  return this.ticketId;
});

// Virtual for response time
supportTicketSchema.virtual('responseTime').get(function() {
  if (this.firstResponseAt) {
    return Math.round((this.firstResponseAt - this.createdAt) / (1000 * 60)); // minutes
  }
  return null;
});

// Method to assign ticket to support staff
supportTicketSchema.methods.assignTo = async function(adminId) {
  this.assignedTo = adminId;
  this.status = 'in_progress';
  
  // Set first response time if not set
  if (!this.firstResponseAt) {
    this.firstResponseAt = new Date();
  }
  
  await this.save();
  return this;
};

// Method to resolve ticket
supportTicketSchema.methods.resolve = async function(resolvedBy, summary) {
  this.status = 'resolved';
  this.resolution = {
    summary: summary,
    resolvedBy: resolvedBy,
    resolvedAt: new Date()
  };
  await this.save();
  return this;
};

// Method to close ticket
supportTicketSchema.methods.close = async function() {
  this.status = 'closed';
  await this.save();
  return this;
};

// Method to escalate ticket
supportTicketSchema.methods.escalate = async function(escalatedToId) {
  this.isEscalated = true;
  this.escalatedAt = new Date();
  this.escalatedTo = escalatedToId;
  this.priority = 'urgent';
  await this.save();
  return this;
};

// Method to add message to ticket
supportTicketSchema.methods.addMessage = async function(senderId, message, isInternal = false) {
  const TicketMessage = require('./TicketMessage');
  
  const ticketMessage = await TicketMessage.create({
    ticket: this._id,
    sender: senderId,
    message: message,
    isInternal: isInternal
  });
  
  // Update first response time
  if (!this.firstResponseAt && this.assignedTo && senderId !== this.user) {
    this.firstResponseAt = new Date();
  }
  
  await this.save();
  return ticketMessage;
};

// Static method to get ticket statistics
supportTicketSchema.statics.getStatistics = async function(startDate = null, endDate = null) {
  const matchStage = {};
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    avgResponseTime: 0,
    slaCompliance: 0
  };
  
  let totalResponseTime = 0;
  let responseTimeCount = 0;
  let withinSla = 0;
  let slaCount = 0;
  
  stats.forEach(stat => {
    result.total += stat.count;
    
    switch (stat._id) {
      case 'open':
        result.open = stat.count;
        break;
      case 'in_progress':
        result.inProgress = stat.count;
        break;
      case 'resolved':
        result.resolved = stat.count;
        break;
      case 'closed':
        result.closed = stat.count;
        break;
    }
  });
  
  // Get response time and SLA stats
  const ticketsWithResponseTime = await this.aggregate([
    { $match: { ...matchStage, firstResponseAt: { $ne: null } } },
    {
      $addFields: {
        responseTimeMinutes: {
          $divide: [
            { $subtract: ['$firstResponseAt', '$createdAt'] },
            60000
          ]
        },
        withinSla: {
          $cond: [
            { $lte: ['$slaDeadline', '$firstResponseAt'] },
            1,
            0
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTimeMinutes' },
        withinSlaCount: { $sum: '$withinSla' },
        totalTickets: { $sum: 1 }
      }
    }
  ]);
  
  if (ticketsWithResponseTime.length > 0) {
    result.avgResponseTime = Math.round(ticketsWithResponseTime[0].avgResponseTime);
    result.slaCompliance = ticketsWithResponseTime[0].totalTickets > 0 
      ? Math.round((ticketsWithResponseTime[0].withinSlaCount / ticketsWithResponseTime[0].totalTickets) * 100)
      : 0;
  }
  
  return result;
};

// Static method to get tickets by status for admin
supportTicketSchema.statics.getTicketsForAdmin = async function(status = null, assignedTo = null, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const query = {};
  
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  
  return await this.find(query)
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name email')
    .populate('relatedOrder', 'orderId')
    .populate('relatedRestaurant', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user tickets
supportTicketSchema.statics.getUserTickets = async function(userId, limit = 20, skip = 0) {
  return await this.find({ user: userId })
    .populate('assignedTo', 'name email')
    .populate('relatedOrder', 'orderId')
    .populate('relatedRestaurant', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
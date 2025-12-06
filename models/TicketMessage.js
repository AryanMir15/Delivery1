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

// Indexes for performance
ticketMessageSchema.index({ ticket: 1, createdAt: -1 });
ticketMessageSchema.index({ sender: 1 });
ticketMessageSchema.index({ isInternal: 1 });

module.exports = mongoose.model('TicketMessage', ticketMessageSchema);
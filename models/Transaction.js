const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  referenceType: {
    type: String,
    enum: [
      'order', 'refund', 'withdrawal', 'commission', 'bonus', 
      'penalty', 'topup', 'manual', 'earning', 'delivery_fee'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Audit fields
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  // Gateway transaction details
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ referenceId: 1, referenceType: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  const sign = this.type === 'debit' ? '-' : '+';
  return `${sign}$${this.amount.toFixed(2)}`;
});

// Static method to get transaction summary for a wallet
transactionSchema.statics.getSummaryByWallet = async function(walletId, startDate, endDate) {
  const matchStage = { wallet: walletId };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        transactions: { $push: '$$ROOT' }
      }
    }
  ]);
  
  let totalCredits = 0;
  let totalDebits = 0;
  
  summary.forEach(item => {
    if (item._id === 'credit') {
      totalCredits = item.totalAmount;
    } else if (item._id === 'debit') {
      totalDebits = item.totalAmount;
    }
  });
  
  return {
    totalCredits,
    totalDebits,
    netAmount: totalCredits - totalDebits,
    totalTransactions: summary.reduce((sum, item) => sum + item.count, 0)
  };
};

// Method to get recent transactions with pagination
transactionSchema.statics.getRecentTransactions = async function(walletId, limit = 20, skip = 0) {
  return await this.find({ wallet: walletId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('processedBy', 'name email');
};

module.exports = mongoose.model('Transaction', transactionSchema);
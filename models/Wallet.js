const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Security and limits
  dailyWithdrawalLimit: {
    type: Number,
    default: 1000
  },
  monthlyWithdrawalLimit: {
    type: Number,
    default: 20000
  },
  // Auto top-up settings
  autoTopUp: {
    enabled: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 10
    },
    amount: {
      type: Number,
      default: 50
    }
  },
  // Last transactions for quick reference
  lastTransactionAt: Date,
  lastWithdrawalAt: Date
}, {
  timestamps: true
});

// Indexes for performance
walletSchema.index({ user: 1 });
walletSchema.index({ balance: 1 });
walletSchema.index({ isActive: 1 });

// Methods for wallet operations
walletSchema.methods.addBalance = async function(amount, reason = 'Credit', referenceId = null) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  this.balance += amount;
  this.lastTransactionAt = new Date();
  await this.save();
  
  // Create transaction record
  const Transaction = require('./Transaction');
  await Transaction.create({
    wallet: this._id,
    type: 'credit',
    amount: amount,
    balanceAfter: this.balance,
    description: reason,
    referenceId: referenceId,
    referenceType: 'manual'
  });
  
  return this;
};

walletSchema.methods.deductBalance = async function(amount, reason = 'Debit', referenceId = null) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  this.balance -= amount;
  this.lastTransactionAt = new Date();
  await this.save();
  
  // Create transaction record
  const Transaction = require('./Transaction');
  await Transaction.create({
    wallet: this._id,
    type: 'debit',
    amount: amount,
    balanceAfter: this.balance,
    description: reason,
    referenceId: referenceId,
    referenceType: 'manual'
  });
  
  return this;
};

walletSchema.methods.canWithdraw = function(amount) {
  if (!this.isActive) return false;
  if (this.balance < amount) return false;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Check daily limit (simplified - would need to check actual withdrawals)
  if (amount > this.dailyWithdrawalLimit) return false;
  
  // Check monthly limit (simplified - would need to check actual withdrawals)
  if (amount > this.monthlyWithdrawalLimit) return false;
  
  return true;
};

// Static method to get or create wallet for user
walletSchema.statics.getOrCreateForUser = async function(userId) {
  let wallet = await this.findOne({ user: userId });
  
  if (!wallet) {
    wallet = await this.create({ user: userId });
  }
  
  return wallet;
};

module.exports = mongoose.model('Wallet', walletSchema);
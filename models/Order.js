const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variation: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variation'
    },
    title: String,
    price: Number,
    discounted: Number
  },
  addons: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Addon'
    },
    title: String,
    description: String,
    quantityMinimum: Number,
    quantityMaximum: Number,
    options: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId
      },
      title: String,
      description: String,
      price: Number
    }]
  }],
  specialInstructions: String,
  isActive: {
    type: Boolean,
    default: true
  }
});

const addressSchema = new mongoose.Schema({
  deliveryAddress: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  details: String,
  label: String
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: false // Auto-generated in pre-save hook
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pendingRiders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  items: [orderItemSchema],
  deliveryAddress: addressSchema,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'stripe', 'paypal', 'chapa', 'telebirr', 'cbebirr'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentTransactionId: {
    type: String
  },
  paymentReference: {
    type: String
  },
  paymentMetadata: {
    type: mongoose.Schema.Types.Mixed
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'accepted', 'preparing', 'ready', 'picked', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  tipping: {
    type: Number,
    default: 0,
    min: 0
  },
  taxationAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedTime: Date,
  preparationTime: {
    type: Number,
    min: 0
  },
  completionTime: Date,
  acceptedAt: Date,
  pickedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  assignedAt: Date,
  instructions: String,
  reason: String,
  isPickedUp: {
    type: Boolean,
    default: false
  },
  isRiderRinged: {
    type: Boolean,
    default: false
  },
  isRinged: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate orderId before validation
orderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes for efficient queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ rider: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
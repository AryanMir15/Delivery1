// AuditLog model stub
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    default: 'vendor'
  },
  entityId: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Static methods for logging
AuditLog.logVendorListView = async (userId, metadata) => {
  const log = new AuditLog({
    action: 'VIEW_VENDOR_LIST',
    entityType: 'vendor',
    entityId: 'list',
    performedBy: userId,
    metadata: metadata
  });
  await log.save();
};

AuditLog.logVendorAction = async (action, userId, entityId, values = {}, metadata) => {
  const log = new AuditLog({
    action,
    entityType: 'vendor',
    entityId,
    performedBy: userId,
    oldValues: values.oldValue,
    newValues: values.newValue,
    metadata: metadata
  });
  await log.save();
};

AuditLog.logVendorCreate = async (userId, vendor, metadata) => {
  const log = new AuditLog({
    action: 'CREATE_VENDOR',
    entityType: 'vendor',
    entityId: vendor._id.toString(),
    performedBy: userId,
    newValues: {
      name: vendor.name,
      email: vendor.email,
      role: vendor.role
    },
    metadata: metadata
  });
  await log.save();
};

AuditLog.logVendorUpdate = async (userId, oldValues, newVendor, metadata) => {
  const log = new AuditLog({
    action: 'UPDATE_VENDOR',
    entityType: 'vendor',
    entityId: newVendor._id.toString(),
    performedBy: userId,
    oldValues: oldValues,
    newValues: {
      name: newVendor.name,
      email: newVendor.email,
      isActive: newVendor.isActive,
      role: newVendor.role
    },
    metadata: metadata
  });
  await log.save();
};

AuditLog.logVendorDelete = async (userId, vendor, metadata) => {
  const log = new AuditLog({
    action: 'DELETE_VENDOR',
    entityType: 'vendor',
    entityId: vendor._id.toString(),
    performedBy: userId,
    oldValues: {
      name: vendor.name,
      email: vendor.email,
      role: vendor.role
    },
    metadata: metadata
  });
  await log.save();
};

module.exports = AuditLog;
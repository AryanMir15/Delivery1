const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true, // email or phone
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['email', 'phone'],
    required: true,
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'password_reset', 'verification'],
    default: 'verification',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - MongoDB will auto-delete expired documents
  },
}, {
  timestamps: true,
});

// Index for faster lookups
otpSchema.index({ identifier: 1, type: 1, verified: 1 });

// Method to check if OTP is valid
otpSchema.methods.isValid = function() {
  return !this.verified && this.expiresAt > new Date() && this.attempts < 5;
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  await this.save();
};

// Method to mark as verified
otpSchema.methods.markAsVerified = async function() {
  this.verified = true;
  await this.save();
};

// Static method to create or update OTP
otpSchema.statics.createOTP = async function(identifier, otp, type, purpose = 'verification') {
  // Delete any existing unverified OTPs for this identifier
  await this.deleteMany({ identifier, type, verified: false });

  // Create new OTP with 10 minute expiration
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return await this.create({
    identifier,
    otp,
    type,
    purpose,
    expiresAt,
  });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(identifier, otp, type) {
  const otpDoc = await this.findOne({
    identifier,
    type,
    verified: false,
  }).sort({ createdAt: -1 }); // Get the most recent OTP

  if (!otpDoc) {
    return { success: false, message: 'OTP not found or already verified' };
  }

  if (!otpDoc.isValid()) {
    if (otpDoc.expiresAt < new Date()) {
      return { success: false, message: 'OTP has expired' };
    }
    if (otpDoc.attempts >= 5) {
      return { success: false, message: 'Too many attempts. Please request a new OTP' };
    }
    return { success: false, message: 'OTP is no longer valid' };
  }

  if (otpDoc.otp !== otp) {
    await otpDoc.incrementAttempts();
    return { success: false, message: 'Invalid OTP' };
  }

  await otpDoc.markAsVerified();
  return { success: true, message: 'OTP verified successfully', purpose: otpDoc.purpose };
};

module.exports = mongoose.model('OTP', otpSchema);

import mongoose from "mongoose";

// Same shape as EmailVerification, but keyed by mobile number. Used for the
// Partner registration flow's "Verify Your Account" (mobile OTP) step.
const phoneVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete expired verification records
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PhoneVerification = mongoose.model(
  "PhoneVerification",
  phoneVerificationSchema
);

export default PhoneVerification;
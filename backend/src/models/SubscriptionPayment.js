import mongoose from "mongoose";

import { PLAN_KEYS } from "../config/subscriptionPlans.js";

// One row per partner subscription purchase (new plan, renewal or upgrade).
const subscriptionPaymentSchema = new mongoose.Schema(
  {
    // The partner's User account
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan: { type: String, enum: PLAN_KEYS, required: true },

    // Services this purchase will unlock once paid
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true },

    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },

    gatewayOrderId: { type: String, required: true, unique: true },
    gatewayPaymentId: { type: String, default: null },
    gatewaySignature: { type: String, default: null },
    paidAt: { type: Date, default: null },

    // Set once the purchase has been applied to the partner's subscription,
    // so a retried /verify call can never extend the subscription twice.
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const SubscriptionPayment = mongoose.model(
  "SubscriptionPayment",
  subscriptionPaymentSchema
);

export default SubscriptionPayment;
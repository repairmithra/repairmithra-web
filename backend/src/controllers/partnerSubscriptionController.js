import crypto from "crypto";
import Razorpay from "razorpay";

import Technician from "../models/Technician.js";
import Service from "../models/Service.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";

import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_DURATION_DAYS,
  getPlan,
} from "../config/subscriptionPlans.js";
import { isObjectId } from "../utils/validators.js";
import { isSubscriptionActive, serializeSubscription } from "../utils/subscription.js";

const DAY_MS = 24 * 60 * 60 * 1000;

let razorpayClient;
const getRazorpay = () => {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

const planForClient = (p) => ({
  key: p.key,
  name: p.name,
  serviceLimit: p.serviceLimit,
  price: p.price,
  durationDays: SUBSCRIPTION_DURATION_DAYS,
});

const loadTechnician = (userId) =>
  Technician.findOne({ user: userId }).populate("subscription.services", "name slug");

// ======================================================
// GET /api/partner/subscription
// Current subscription + the available plans.
// ======================================================
export const getSubscription = async (req, res) => {
  try {
    const technician = await loadTechnician(req.user._id);

    if (!technician) {
      return res.status(404).json({ success: false, message: "Partner profile not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        subscription: serializeSubscription(technician),
        plans: SUBSCRIPTION_PLANS.map(planForClient),
        // Services the partner signed up with - used to pre-select in the plan picker
        registeredServices: technician.services,
      },
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({ success: false, message: "Unable to load subscription" });
  }
};

// ======================================================
// POST /api/partner/subscription/order
// Body: { plan, serviceIds }   (serviceIds ignored for the "all" plan)
// Creates a Razorpay order for the plan price.
// ======================================================
export const createSubscriptionOrder = async (req, res) => {
  try {
    const plan = getPlan(req.body.plan);

    if (!plan) {
      return res.status(400).json({ success: false, message: "Please choose a valid plan" });
    }

    let services;

    if (plan.key === "all") {
      services = await Service.find({ isActive: true }).select("_id");
    } else {
      const serviceIds = Array.isArray(req.body.serviceIds) ? req.body.serviceIds : [];

      if (!serviceIds.every(isObjectId)) {
        return res.status(400).json({ success: false, message: "Invalid service selected" });
      }

      const unique = [...new Set(serviceIds)];

      if (unique.length !== plan.serviceLimit) {
        return res.status(400).json({
          success: false,
          message: `Please select exactly ${plan.serviceLimit} service${
            plan.serviceLimit > 1 ? "s" : ""
          } for the ${plan.name} plan`,
        });
      }

      services = await Service.find({ _id: { $in: unique }, isActive: true }).select("_id");

      if (services.length !== unique.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected services are not available",
        });
      }
    }

    if (services.length === 0) {
      return res.status(400).json({ success: false, message: "No services are available" });
    }

    const order = await getRazorpay().orders.create({
      amount: Math.round(plan.price * 100), // paise
      currency: "INR",
      receipt: `sub_${Date.now()}_${String(req.user._id).slice(-8)}`,
      notes: { partnerId: String(req.user._id), plan: plan.key },
    });

    const payment = await SubscriptionPayment.create({
      partner: req.user._id,
      plan: plan.key,
      services: services.map((s) => s._id),
      amount: plan.price,
      currency: "INR",
      status: "created",
      gatewayOrderId: order.id,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription payment order created",
      payment: {
        id: payment._id,
        plan: plan.key,
        planName: plan.name,
        amount: payment.amount,
        currency: payment.currency,
        gatewayOrderId: payment.gatewayOrderId,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create subscription order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subscription payment order",
    });
  }
};

// ======================================================
// POST /api/partner/subscription/verify
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Safe to call more than once for the same payment.
// ======================================================
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const payment = await SubscriptionPayment.findOne({
      gatewayOrderId: razorpay_order_id,
      partner: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    if (payment.status !== "paid") {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const expected = Buffer.from(expectedSignature, "hex");
      const received = Buffer.from(razorpay_signature, "hex");

      const isValid =
        expected.length === received.length && crypto.timingSafeEqual(expected, received);

      if (!isValid) {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ success: false, message: "Invalid payment signature" });
      }

      payment.status = "paid";
      payment.gatewayPaymentId = razorpay_payment_id;
      payment.gatewaySignature = razorpay_signature;
      payment.paidAt = new Date();
      await payment.save();
    }

    // Claim the purchase atomically: only the first call applies it.
    const claimed = await SubscriptionPayment.findOneAndUpdate(
      { _id: payment._id, appliedAt: null },
      { $set: { appliedAt: new Date() } },
      { new: true }
    );

    const technician = await Technician.findOne({ user: req.user._id });

    if (!technician) {
      return res.status(404).json({ success: false, message: "Partner profile not found" });
    }

    if (claimed) {
      const plan = getPlan(payment.plan);
      const now = new Date();
      const current = technician.subscription;

      // Renewing the same plan + services while still active stacks on top of
      // the remaining time. Any other purchase (new plan, upgrade, change of
      // services) starts a fresh term from today.
      const sameServices =
        current?.plan === payment.plan &&
        (current.services || []).length === payment.services.length &&
        payment.services.every((id) =>
          (current.services || []).some((s) => String(s) === String(id))
        );

      const startsAt =
        isSubscriptionActive(technician) && sameServices
          ? new Date(current.expiresAt)
          : now;

      technician.subscription = {
        plan: payment.plan,
        services: payment.services,
        amount: plan?.price ?? payment.amount,
        startedAt: sameServices && isSubscriptionActive(technician) ? current.startedAt : now,
        expiresAt: new Date(startsAt.getTime() + SUBSCRIPTION_DURATION_DAYS * DAY_MS),
      };

      // Keep the partner's service list in step with what they pay for.
      technician.services = payment.services;

      await technician.save();
    }

    const fresh = await loadTechnician(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Subscription activated",
      data: { subscription: serializeSubscription(fresh) },
    });
  } catch (error) {
    console.error("Verify subscription payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify subscription payment",
    });
  }
};
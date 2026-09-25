import crypto from "crypto";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import { isObjectId } from "../utils/validators.js";
import { assignNearestTechnician } from "../utils/technicianAssignment.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    if (!isObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
    }).populate("service");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be created for this booking",
      });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Booking is already paid",
      });
    }

    const service = await Service.findOne({
      _id: booking.service._id,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const visitFee = service.visitFee;

    if (!visitFee || visitFee <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service visit fee",
      });
    }

    // Check if a payment record already exists
    let payment = await Payment.findOne({
      booking: booking._id,
    });

    if (payment?.gatewayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Payment order already exists",
        payment: {
          id: payment._id,
          bookingId: payment.booking,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          gatewayOrderId: payment.gatewayOrderId,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    // Razorpay expects amount in paise
    const amountInPaise = Math.round(visitFee * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        customerId: req.user._id.toString(),
        serviceId: booking.service._id.toString(),
      },
    });

    if (!payment) {
      payment = await Payment.create({
        booking: booking._id,
        customer: req.user._id,
        amount: visitFee,
        currency: "INR",
        status: "created",
        gatewayOrderId: razorpayOrder.id,
      });
    } else {
      payment.amount = visitFee;
      payment.currency = "INR";
      payment.status = "created";
      payment.gatewayOrderId = razorpayOrder.id;

      await payment.save();
    }

    return res.status(201).json({
      success: true,
      message: "Razorpay payment order created",
      payment: {
        id: payment._id,
        bookingId: payment.booking,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gatewayOrderId: payment.gatewayOrderId,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create Razorpay payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay payment order",
    });
  }
};

// ======================================================
// VERIFY PAYMENT  (POST /api/payments/verify)
// Safe to call more than once for the same payment.
// ======================================================

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    if (
      !isObjectId(bookingId) ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification details",
      });
    }

    const payment = await Payment.findOne({
      booking: bookingId,
      gatewayOrderId: razorpay_order_id,
      customer: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Already verified earlier (e.g. the request was retried): don't
    // re-check or overwrite anything, just make sure the booking is confirmed.
    if (payment.status !== "paid") {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const expected = Buffer.from(expectedSignature, "hex");
      const received = Buffer.from(razorpay_signature, "hex");

      const isValidSignature =
        expected.length === received.length &&
        crypto.timingSafeEqual(expected, received);

      if (!isValidSignature) {
        payment.status = "failed";
        await payment.save();

        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      payment.status = "paid";
      payment.gatewayPaymentId = razorpay_payment_id;
      payment.gatewaySignature = razorpay_signature;
      payment.paidAt = new Date();

      await payment.save();
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.paymentStatus = "paid";
    booking.paymentId = payment.gatewayPaymentId;

    // Only move a booking forward from "pending_payment"; never pull a
    // booking that a technician is already working on back to "confirmed".
    if (booking.status === "pending_payment") {
      booking.status = "confirmed";
    }

    await booking.save();

    // Try to find the nearest available technician and offer them this job
    // (it will show up as a "New Request" on their partner dashboard).
    if (!booking.technician) {
      await assignNearestTechnician(booking);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        status: payment.status,
        gatewayOrderId: payment.gatewayOrderId,
        gatewayPaymentId: payment.gatewayPaymentId,
        paidAt: payment.paidAt,
      },
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};
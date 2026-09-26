import mongoose from "mongoose";

import { TIME_SLOTS } from "../utils/schedule.js";

const bookingSchema = new mongoose.Schema(
  {
    // Human-friendly reference shown to the customer, e.g. RM-20260920-K7M2
    // (sparse so older bookings created before this field still work)
    bookingCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // Customer who created the booking
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },offeredTechnicians: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

    // Selected service
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },

    // Address snapshot at the time of booking
    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    pincode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/,
    },

    // Optional note from the customer about the problem
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    // Customer location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },

      // IMPORTANT:
      // MongoDB GeoJSON format is [longitude, latitude]
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    // Selected booking date
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    // One of the four fixed slots
    timeSlot: {
      type: String,
      required: true,
      enum: TIME_SLOTS,
    },

    // Technician assigned later (User account of the technician)
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // Booking status
    status: {
      type: String,
      enum: [
        "pending_payment",
        "confirmed",
        "technician_assigned",
        "technician_on_the_way",
        "technician_arrived",
        "inspection_completed",
        "repair_in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending_payment",
      index: true,
    },

    // RepairMithra visit-fee payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentId: {
      type: String,
      default: null,
      trim: true,
    },

    // Actual repair payment is made directly to technician
    repairPaymentStatus: {
      type: String,
      enum: ["pending", "paid_to_technician"],
      default: "pending",
    },

    // Final amount decided after technician inspection
    finalRepairAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    // ----------------------------------------------------------------
    // Partner (technician) workflow
    // ----------------------------------------------------------------

    // Whether the assigned technician has accepted/rejected this job.
    // null until a technician is proposed by the auto-assignment system.
    technicianResponseStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: null,
      index: true,
    },

    // Technicians who already rejected this job, so the same job is never
    // offered to them twice while we look for the next nearest technician.
    rejectedTechnicians: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Customer's rating of the completed job (given from the customer side;
    // shown on the partner's Earnings/Job Details screens).
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, trim: true, maxlength: 300, default: "" },
      ratedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index
bookingSchema.index({
  location: "2dsphere",
});
bookingSchema.index({
  technician: 1,
  bookingDate: 1,
  timeSlot: 1,
});
const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
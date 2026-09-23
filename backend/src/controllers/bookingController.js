import crypto from "crypto";

import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import Service from "../models/Service.js";

import {
  TIME_SLOTS,
  compactDate,
  isPastBookingDate,
  parseBookingDate,
} from "../utils/schedule.js";

import {
  isObjectId,
  isValidLatLng,
  toCoordinate,
} from "../utils/validators.js";

// Letters/digits without look-alikes (no 0/O, 1/I). 32 symbols, so
// `byte % 32` is perfectly uniform.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// RM-<visit date>-<4 random characters>, e.g. RM-20260920-K7M2
const generateBookingCode = (bookingDate) => {
  const suffix = Array.from(crypto.randomBytes(4))
    .map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join("");

  return `RM-${compactDate(bookingDate)}-${suffix}`;
};

const isDuplicateBookingCode = (error) =>
  error?.code === 11000 && error?.keyPattern?.bookingCode;

const asTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

// ======================================================
// CREATE BOOKING  (POST /api/bookings)
// ======================================================

export const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      latitude,
      longitude,
      bookingDate,
      timeSlot,
    } = req.body;

    const address = asTrimmedString(req.body.address);
    const city = asTrimmedString(req.body.city);
    const pincode = asTrimmedString(req.body.pincode);
    const notes = asTrimmedString(req.body.notes);

    // Basic validation
    if (
      !serviceId ||
      !address ||
      !pincode ||
      latitude === undefined ||
      longitude === undefined ||
      !bookingDate ||
      !timeSlot
    ) {
      return res.status(400).json({
        success: false,
        message: "All booking details are required",
      });
    }

    if (!isObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service",
      });
    }

    if (address.length < 5 || address.length > 250) {
      return res.status(400).json({
        success: false,
        message: "Address must be between 5 and 250 characters",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6 digit pincode",
      });
    }

    if (city.length > 80 || notes.length > 300) {
      return res.status(400).json({
        success: false,
        message: "City or notes are too long",
      });
    }

    // Validate coordinates
    const lat = toCoordinate(latitude);
    const lng = toCoordinate(longitude);

    if (!isValidLatLng(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location coordinates",
      });
    }

    // Validate booking date (calendar date, stored as midnight UTC)
    const selectedDate = parseBookingDate(bookingDate);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date",
      });
    }

    // Prevent booking in the past (compared in Indian time)
    if (isPastBookingDate(selectedDate)) {
      return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past",
      });
    }

    if (!TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking time slot",
      });
    }

    // Check service
    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Create booking. The booking code is random, so in the (very unlikely)
    // event of a collision we simply try again with a new one.
    let booking = null;

    for (let attempt = 0; attempt < 5 && !booking; attempt += 1) {
      try {
        booking = await Booking.create({
          bookingCode: generateBookingCode(selectedDate),

          customer: req.user._id,

          service: service._id,

          address,
          city,
          pincode,
          notes,

          location: {
            type: "Point",
            coordinates: [lng, lat],
          },

          bookingDate: selectedDate,
          timeSlot,

          status: "pending_payment",
          paymentStatus: "pending",
        });
      } catch (error) {
        if (!isDuplicateBookingCode(error)) {
          throw error;
        }
      }
    }

    if (!booking) {
      throw new Error("Could not generate a unique booking code");
    }

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
    });
  }
};

// ======================================================
// LIST MY BOOKINGS  (GET /api/bookings)
// Every booking made by the logged-in customer, most recent first.
// ======================================================

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: req.user._id,
    })
      .populate("service", "name slug visitFee")
      .populate("technician", "fullName phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("List bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

// ======================================================
// GET ONE BOOKING  (GET /api/bookings/:id)
// Only the customer who made the booking can read it.
// ======================================================

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      customer: req.user._id,
    })
      .populate("service", "name slug visitFee")
      // Technician contact details are only shared once one is assigned
      .populate("technician", "fullName phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const payment = await Payment.findOne({
      booking: booking._id,
    }).select("amount currency status paidAt gatewayPaymentId");

    return res.status(200).json({
      success: true,
      booking: {
        ...booking.toObject(),

        // The fee actually charged (falls back to the current service fee
        // for bookings that have not reached payment yet)
        visitFee: payment?.amount ?? booking.service?.visitFee ?? null,

        payment: payment
          ? {
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              paidAt: payment.paidAt,
              transactionId: payment.gatewayPaymentId,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
    });
  }
};
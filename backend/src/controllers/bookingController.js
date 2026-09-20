import Booking from "../models/Booking.js";
import Service from "../models/Service.js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      address,
      pincode,
      latitude,
      longitude,
      bookingDate,
      timeSlot,
    } = req.body;

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

    // Validate coordinates
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid location coordinates",
      });
    }

    // Validate booking date
    const selectedDate = new Date(bookingDate);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date",
      });
    }

    // Prevent booking in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past",
      });
    }

    // Allowed booking slots
    const allowedSlots = [
      "06:00 AM - 10:00 AM",
      "10:00 AM - 02:00 PM",
      "02:00 PM - 06:00 PM",
      "06:00 PM - 10:00 PM",
    ];

    if (!allowedSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking time slot",
      });
    }

    // Create booking
    const booking = await Booking.create({
      customer: req.user._id,

      service: service._id,

      address,
      pincode,

      location: {
        type: "Point",
        coordinates: [lng, lat],
      },

      bookingDate: selectedDate,
      timeSlot,

      status: "pending_payment",
      paymentStatus: "pending",
    });

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
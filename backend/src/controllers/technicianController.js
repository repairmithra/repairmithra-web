import Technician from "../models/Technician.js";
import Booking from "../models/Booking.js";

import {
  TIME_SLOTS,
  dayRange,
  parseBookingDate,
} from "../utils/schedule.js";

import {
  isObjectId,
  isValidLatLng,
  toCoordinate,
} from "../utils/validators.js";

// GET /api/technicians/nearby
//   ?serviceId=&latitude=&longitude=&bookingDate=YYYY-MM-DD&timeSlot=
//
// Used by the customer booking page to check that someone can actually
// take the job BEFORE the customer pays the visit fee.
export const findNearbyTechnicians = async (req, res) => {
  try {
    const {
      serviceId,
      latitude,
      longitude,
      bookingDate,
      timeSlot,
    } = req.query;

    if (
      !serviceId ||
      latitude === undefined ||
      longitude === undefined ||
      !bookingDate ||
      !timeSlot
    ) {
      return res.status(400).json({
        success: false,
        message:
          "serviceId, latitude, longitude, bookingDate and timeSlot are required",
      });
    }

    if (!isObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service",
      });
    }

    const lat = toCoordinate(latitude);
    const lng = toCoordinate(longitude);

    if (!isValidLatLng(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location coordinates",
      });
    }

    if (typeof timeSlot !== "string" || !TIME_SLOTS.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking time slot",
      });
    }

    const selectedDate = parseBookingDate(bookingDate);

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date",
      });
    }

    // Whole booking day, [start, end)
    const { start, end } = dayRange(selectedDate);

    // Technicians already assigned to a booking in this date + slot.
    // Booking.technician stores the technician's USER id.
    const existingBookings = await Booking.find({
      bookingDate: {
        $gte: start,
        $lt: end,
      },

      timeSlot,

      technician: {
        $ne: null,
      },

      status: {
        $nin: ["cancelled"],
      },
    }).select("technician");

    const busyUserIds = existingBookings
      .map((booking) => booking.technician)
      .filter(Boolean);

    // Find nearby technicians
    const query = {
      services: serviceId,
      isActive: true,
      isAvailable: true,

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },

          $maxDistance: 20000,
        },
      },
    };

    // Exclude technicians who are already booked.
    // (Technician._id is NOT the same as the user id stored on bookings,
    // so this must filter on the `user` field.)
    if (busyUserIds.length > 0) {
      query.user = {
        $nin: busyUserIds,
      };
    }

    const technicians = await Technician.find(query)
      .populate("user", "fullName")
      .populate("services", "name slug");

    // Customers only need to know that help is available. Never send a
    // technician's phone, email, home address or exact location.
    return res.status(200).json({
      success: true,
      count: technicians.length,
      technicians: technicians.map((technician) => ({
        id: technician._id,
        name: technician.user?.fullName || "RepairMithra Technician",
        services: technician.services.map((service) => ({
          name: service.name,
          slug: service.slug,
        })),
      })),
    });
  } catch (error) {
    console.error(
      "Find available technicians error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to find available technicians",
    });
  }
};
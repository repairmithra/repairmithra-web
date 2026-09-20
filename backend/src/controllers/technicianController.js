import Technician from "../models/Technician.js";
import Booking from "../models/Booking.js";

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

    const selectedDate = new Date(bookingDate);

    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking date",
      });
    }

    // Start and end of selected day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find technicians already assigned for this date + slot
    const existingBookings = await Booking.find({
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },

      timeSlot,

      technician: {
        $ne: null,
      },

      status: {
        $nin: ["cancelled"],
      },
    }).select("technician");

    const busyTechnicianIds = existingBookings
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

    // Exclude technicians already booked
    if (busyTechnicianIds.length > 0) {
      query._id = {
        $nin: busyTechnicianIds,
      };
    }

    const technicians = await Technician.find(query)
      .populate(
        "user",
        "fullName email phone address pincode"
      )
      .populate(
        "services",
        "name slug"
      );

    return res.status(200).json({
      success: true,
      count: technicians.length,
      technicians,
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
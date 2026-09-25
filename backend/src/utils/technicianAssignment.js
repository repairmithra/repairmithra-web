import Technician from "../models/Technician.js";
import Booking from "../models/Booking.js";

import { TIME_SLOTS, dayRange } from "./schedule.js";

// ======================================================
// assignNearestTechnician(booking)
//
// Called right after a booking's visit fee is paid. Finds the nearest
// available technician (who offers this service, isn't already busy in the
// same slot, and hasn't already rejected this exact job) and "offers" the
// job to them: booking.technician is set, technicianResponseStatus is set to
// "pending", and it will show up as a "New Request" on that partner's
// dashboard until they accept or reject it.
//
// Returns the updated booking (or the original booking, unchanged, if no
// technician is currently available).
// ======================================================
export const assignNearestTechnician = async (booking) => {
  try {
    const { start, end } = dayRange(booking.bookingDate);

    // Technicians already assigned to a booking in this date + slot.
    const busyBookings = await Booking.find({
      _id: { $ne: booking._id },
      bookingDate: { $gte: start, $lt: end },
      timeSlot: booking.timeSlot,
      technician: { $ne: null },
      status: { $nin: ["cancelled"] },
    }).select("technician");

    const busyUserIds = busyBookings.map((b) => b.technician).filter(Boolean);

    const excludedUserIds = [
      ...busyUserIds,
      ...(booking.rejectedTechnicians || []),
    ];

    const query = {
      services: booking.service,
      isActive: true,
      isAvailable: true,

      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: booking.location.coordinates,
          },
          $maxDistance: 20000,
        },
      },
    };

    if (excludedUserIds.length > 0) {
      query.user = { $nin: excludedUserIds };
    }

    const nearest = await Technician.findOne(query);

    if (!nearest) {
      // No one available right now. Leave the booking unassigned; the
      // customer sees "We are notifying nearby technicians".
      return booking;
    }

    booking.technician = nearest.user;
    booking.technicianResponseStatus = "pending";

    await booking.save();

    return booking;
  } catch (error) {
    console.error("Technician auto-assignment error:", error);
    // Never let a matching failure block payment confirmation.
    return booking;
  }
};

// Re-offers a job to the next nearest technician after a rejection. If no
// one else is available, the booking is left unassigned (status stays
// "confirmed") so it can be retried later or handled by support.
export const reassignAfterRejection = async (booking) => {
  booking.technician = null;
  booking.technicianResponseStatus = null;

  return assignNearestTechnician(booking);
};

export const validTimeSlot = (slot) => TIME_SLOTS.includes(slot);
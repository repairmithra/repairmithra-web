import express from "express";

import {
  createBooking,
  getBookingById,
  getMyBookings,
} from "../controllers/bookingController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer creates a booking
router.post(
  "/",
  authMiddleware,
  createBooking
);

// Customer reads all of their own bookings
router.get(
  "/",
  authMiddleware,
  getMyBookings
);

// Customer reads one of their own bookings
router.get(
  "/:id",
  authMiddleware,
  getBookingById
);

export default router;
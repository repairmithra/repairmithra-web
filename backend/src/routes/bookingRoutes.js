import express from "express";

import {
  createBooking,
  getBookingById,
  getMyBookings,
} from "../controllers/bookingController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("customer"),
  createBooking
);

router.get(
  "/",
  authMiddleware,
  requireRole("customer"),
  getMyBookings
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("customer"),
  getBookingById
);

export default router;
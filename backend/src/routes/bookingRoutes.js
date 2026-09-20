import express from "express";

import {
  createBooking,
} from "../controllers/bookingController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer creates a booking
router.post(
  "/",
  authMiddleware,
  createBooking
);

export default router;
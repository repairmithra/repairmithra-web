import express from "express";
import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  addAddress,
  deleteAddress,
  sendVerificationCode,
  verifyVerificationCode,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// EMAIL OTP RATE LIMITER
// ======================================================

const verificationCodeLimiter = rateLimit({
  // Loosened for demo purposes so repeated test registrations / resends
  // during a walkthrough don't trip the limiter. Tighten this back up
  // (e.g. windowMs: 15 * 60 * 1000, max: 5) before going to production.
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many verification code requests. Please try again later.",
  },
});

// ======================================================
// REGISTRATION
// ======================================================

// Send email verification code
router.post(
  "/send-verification-code",
  verificationCodeLimiter,
  sendVerificationCode
);

// Verify email verification code
router.post(
  "/verify-verification-code",
  verifyVerificationCode
);

// Register customer
router.post(
  "/register",
  registerUser
);

// ======================================================
// LOGIN
// ======================================================

router.post(
  "/login",
  loginUser
);

// ======================================================
// PROFILE
// ======================================================

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);

// ======================================================
// SAVED ADDRESSES
// ======================================================

router.post(
  "/addresses",
  authMiddleware,
  addAddress
);

router.delete(
  "/addresses/:addressId",
  authMiddleware,
  deleteAddress
);

export default router;
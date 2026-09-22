import express from "express";
import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  sendVerificationCode,
  verifyVerificationCode,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// ======================================================
// EMAIL OTP RATE LIMITER
// ======================================================

const verificationCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

export default router;
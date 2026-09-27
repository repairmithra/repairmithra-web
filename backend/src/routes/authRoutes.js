import express from "express";
import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  getProfile,
  sendVerificationCode,
  verifyVerificationCode,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const verificationCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification code requests. Please try again later.",
  },
});

const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post(
  "/send-verification-code",
  verificationCodeLimiter,
  sendVerificationCode
);

router.post(
  "/verify-verification-code",
  verifyCodeLimiter,
  verifyVerificationCode
);

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginLimiter,
  loginUser
);

router.get(
  "/profile",
  authMiddleware,
  requireRole("customer"),
  getProfile
);

export default router;
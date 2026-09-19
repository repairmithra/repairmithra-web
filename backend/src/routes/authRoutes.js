import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
  sendVerificationCode,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// ======================================================
// REGISTRATION
// ======================================================

// Send 6-digit email verification code
router.post(
  "/send-verification-code",
  sendVerificationCode
);

// Create new customer account
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


export default router;
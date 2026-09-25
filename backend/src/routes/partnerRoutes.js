import express from "express";
import rateLimit from "express-rate-limit";

import {
  sendPartnerOtp,
  verifyPartnerOtp,
  registerPartner,
  loginPartner,
  getPartnerProfile,
  updatePartnerProfile,
  getPartnerDashboard,
  getPartnerJobs,
  getPartnerJobById,
  acceptJob,
  rejectJob,
  updateJobStatus,
  getPartnerEarnings,
} from "../controllers/partnerController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import technicianMiddleware from "../middleware/technicianMiddleware.js";

const router = express.Router();

const otpLimiter = rateLimit({
  // Loosened for demo purposes so repeated test registrations / resends
  // during a walkthrough don't trip the limiter. Tighten this back up
  // (e.g. windowMs: 15 * 60 * 1000, max: 5) before going to production.
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification code requests. Please try again later.",
  },
});

// ======================================================
// REGISTRATION (Steps 2 & 3: Registration + Verification)
// ======================================================
router.post("/send-otp", otpLimiter, sendPartnerOtp);
router.post("/verify-otp", verifyPartnerOtp);
router.post("/register", registerPartner);

// ======================================================
// LOGIN (Step 4)
// ======================================================
router.post("/login", loginPartner);

// Everything below requires a logged-in partner (technician) account
router.use(authMiddleware, technicianMiddleware);

// ======================================================
// PROFILE (Step 9)
// ======================================================
router.get("/profile", getPartnerProfile);
router.patch("/profile", updatePartnerProfile);

// ======================================================
// DASHBOARD (Step 5)
// ======================================================
router.get("/dashboard", getPartnerDashboard);

// ======================================================
// JOBS (Steps 6 & 7)
// ======================================================
router.get("/jobs", getPartnerJobs);
router.get("/jobs/:id", getPartnerJobById);
router.post("/jobs/:id/accept", acceptJob);
router.post("/jobs/:id/reject", rejectJob);
router.post("/jobs/:id/status", updateJobStatus);

// ======================================================
// EARNINGS (Step 8)
// ======================================================
router.get("/earnings", getPartnerEarnings);

export default router;
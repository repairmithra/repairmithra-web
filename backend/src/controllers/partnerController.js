import crypto from "crypto";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import Technician from "../models/Technician.js";
import Service from "../models/Service.js";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import EmailVerification from "../models/EmailVerification.js";

import generateToken from "../utils/generateToken.js";
import { isObjectId, isValidLatLng, toCoordinate } from "../utils/validators.js";
import { sendVerificationEmail } from "../services/emailService.js";

const asTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");

// ======================================================
// SEND PARTNER EMAIL OTP   (POST /api/partner/send-otp)
// Step 3 in the Partner Workflow: "Verify Your Account".
// ======================================================

export const sendPartnerOtp = async (req, res) => {
  try {
    const email = asTrimmedString(req.body.email).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
    }

    const existing = await EmailVerification.findOne({ email });

    if (existing) {
      const cooldown = 60 * 1000;
      const sinceLast = Date.now() - new Date(existing.lastSentAt).getTime();

      if (sinceLast < cooldown) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            (cooldown - sinceLast) / 1000
          )} seconds before requesting another code.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (existing) {
      existing.otpHash = otpHash;
      existing.expiresAt = expiresAt;
      existing.attempts = 0;
      existing.lastSentAt = new Date();
      await existing.save();
    } else {
      await EmailVerification.create({
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      });
    }

    // --------------------------------------------------
    // DEMO MODE: show the code in the terminal (and hand it back to the
    // frontend) instead of e-mailing it, so the partner flow can be demoed
    // without a working Resend account or hitting email provider limits.
    // Needs DEV_LOG_OTP=true in .env, and is ignored when NODE_ENV=production.
    // --------------------------------------------------

    if (
      process.env.DEV_LOG_OTP === "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.log(`🔑 [DEV] Partner verification code for ${email}: ${otp}`);

      return res.status(200).json({
        success: true,
        message: "Verification code sent to your email address",
        devOtp: otp,
      });
    }

    await sendVerificationEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email address",
    });
  } catch (error) {
    console.error("Send partner OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code",
    });
  }
};

// ======================================================
// VERIFY PARTNER EMAIL OTP   (POST /api/partner/verify-otp)
// ======================================================

export const verifyPartnerOtp = async (req, res) => {
  try {
    const email = asTrimmedString(req.body.email).toLowerCase();
    const otp = asTrimmedString(req.body.otp);

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Email and 6 digit code are required",
      });
    }

    const verification = await EmailVerification.findOne({ email });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "Verification code not found. Please request a new code.",
      });
    }

    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({ _id: verification._id });

      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({ _id: verification._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const submittedHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (submittedHash !== verification.otpHash) {
      verification.attempts += 1;
      await verification.save();

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify partner OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify code",
    });
  }
};

// ======================================================
// PARTNER REGISTRATION   (POST /api/partner/register)
// Step 2 → creates a User (role: "technician") + Technician profile.
// ======================================================

export const registerPartner = async (req, res) => {
  try {
    const fullName = asTrimmedString(req.body.fullName);
    const phone = asTrimmedString(req.body.phone);
    const email = asTrimmedString(req.body.email).toLowerCase();
    const otp = asTrimmedString(req.body.otp);
    const address = asTrimmedString(req.body.address);
    const pincode = asTrimmedString(req.body.pincode);
    const city = asTrimmedString(req.body.city);
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const experienceYears = Number(req.body.experienceYears) || 0;
    const serviceIds = Array.isArray(req.body.serviceIds) ? req.body.serviceIds : [];
    const latitude = toCoordinate(req.body.latitude);
    const longitude = toCoordinate(req.body.longitude);

    if (
      !fullName ||
      !phone ||
      !email ||
      !otp ||
      !address ||
      !pincode ||
      !city ||
      !password ||
      !confirmPassword ||
      serviceIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields",
      });
    }

    if (fullName.length < 2 || fullName.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 60 characters",
      });
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Indian mobile number",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6 digit pincode",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (!serviceIds.every(isObjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service category selected",
      });
    }

    if (!isValidLatLng(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: "We couldn't locate your address. Please re-check it.",
      });
    }

    // Re-verify the OTP on the server (never trust the client's word alone)
    const verification = await EmailVerification.findOne({ email });

    if (!verification || verification.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please verify your email again.",
      });
    }

    const submittedHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (submittedHash !== verification.otpHash) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email is already registered"
            : "Mobile number is already registered",
      });
    }

    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });

    if (services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one valid service category",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      phone,
      address,
      pincode,
      password: hashedPassword,
      role: "technician",
      isVerified: true,
    });

    const technician = await Technician.create({
      user: user._id,
      services: services.map((s) => s._id),
      location: { type: "Point", coordinates: [longitude, latitude] },
      city,
      experienceYears,
      isActive: true,
      isAvailable: true,
    });

    await EmailVerification.deleteOne({ _id: verification._id });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "Partner account created successfully",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        technicianId: technician._id,
      },
    });
  } catch (error) {
    console.error("Register partner error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create partner account",
    });
  }
};

// ======================================================
// PARTNER LOGIN   (POST /api/partner/login)
// identifier = mobile number OR email
// ======================================================

export const loginPartner = async (req, res) => {
  try {
    const identifier = asTrimmedString(req.body.identifier).toLowerCase();
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile/email and password are required",
      });
    }

    const user = await User.findOne({
      role: "technician",
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Partner login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// ======================================================
// PARTNER PROFILE   (GET/PATCH /api/partner/profile)
// ======================================================

export const getPartnerProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id }).populate(
      "services",
      "name slug"
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Partner profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
        technician,
        avgRating:
          technician.ratingCount > 0
            ? Number((technician.ratingSum / technician.ratingCount).toFixed(1))
            : null,
      },
    });
  } catch (error) {
    console.error("Get partner profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load partner profile",
    });
  }
};

export const updatePartnerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const technician = await Technician.findOne({ user: req.user._id });

    if (!user || !technician) {
      return res.status(404).json({
        success: false,
        message: "Partner profile not found",
      });
    }

    const { fullName, phone, address, pincode, city, experienceYears, bio, isAvailable } =
      req.body;

    if (fullName !== undefined) {
      const trimmed = asTrimmedString(fullName);
      if (trimmed.length < 2 || trimmed.length > 60) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 60 characters",
        });
      }
      user.fullName = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = asTrimmedString(phone);
      if (!/^[6-9][0-9]{9}$/.test(trimmed)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid Indian mobile number",
        });
      }
      const clash = await User.findOne({ phone: trimmed, _id: { $ne: user._id } });
      if (clash) {
        return res.status(409).json({ success: false, message: "Phone number already in use" });
      }
      user.phone = trimmed;
    }

    if (address !== undefined) user.address = asTrimmedString(address) || user.address;
    if (pincode !== undefined && /^[0-9]{6}$/.test(pincode)) user.pincode = pincode;

    if (city !== undefined) technician.city = asTrimmedString(city);
    if (bio !== undefined) technician.bio = asTrimmedString(bio).slice(0, 500);
    if (experienceYears !== undefined) {
      technician.experienceYears = Math.max(0, Number(experienceYears) || 0);
    }
    if (typeof isAvailable === "boolean") technician.isAvailable = isAvailable;

    if (Array.isArray(req.body.serviceIds) && req.body.serviceIds.length > 0) {
      if (!req.body.serviceIds.every(isObjectId)) {
        return res.status(400).json({ success: false, message: "Invalid service selected" });
      }
      const services = await Service.find({ _id: { $in: req.body.serviceIds }, isActive: true });
      technician.services = services.map((s) => s._id);
    }

    await user.save();
    await technician.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: updatedUser, technician },
    });
  } catch (error) {
    console.error("Update partner profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// ======================================================
// PARTNER DASHBOARD   (GET /api/partner/dashboard)
// ======================================================

export const getPartnerDashboard = async (req, res) => {
  try {
    const technicianUserId = req.user._id;

    const [newRequests, acceptedJobs, activeServices, completedJobs, earningsAgg, recentRequests] =
      await Promise.all([
        Booking.countDocuments({
  offeredTechnicians: technicianUserId,
  technician: null,
  technicianResponseStatus: "pending",
}),
       Booking.countDocuments({
          technician: technicianUserId,
          technicianResponseStatus: "accepted",
          status: "technician_assigned",
        }),
        Booking.countDocuments({
          technician: technicianUserId,
          technicianResponseStatus: "accepted",
          status: {
            $in: ["technician_on_the_way", "technician_arrived", "inspection_completed", "repair_in_progress"],
          },
        }),
        Booking.countDocuments({
          technician: technicianUserId,
          status: "completed",
        }),
        Booking.aggregate([
          {
            $match: {
              technician: technicianUserId,
              status: "completed",
              repairPaymentStatus: "paid_to_technician",
            },
          },
          { $group: { _id: null, total: { $sum: "$finalRepairAmount" } } },
        ]),
        Booking.find({
  offeredTechnicians: technicianUserId,
  technician: null,
  technicianResponseStatus: "pending",
})
          .populate("service", "name slug visitFee")
          .populate("customer", "fullName")
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    const totalEarnings = earningsAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          newRequests,
          acceptedJobs,
          activeServices,
          completedJobs,
          totalEarnings,
        },
        recentRequests: recentRequests.map((b) => ({
          id: b._id,
          bookingCode: b.bookingCode,
          serviceName: b.service?.name || "Service",
          customerName: b.customer?.fullName || "Customer",
          address: b.address,
          city: b.city,
          bookingDate: b.bookingDate,
          timeSlot: b.timeSlot,
          visitFee: b.service?.visitFee ?? null,
        })),
      },
    });
  } catch (error) {
    console.error("Partner dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard",
    });
  }
};

// ======================================================
// PARTNER JOBS LIST   (GET /api/partner/jobs?status=new|accepted|active|completed)
// ======================================================

const STATUS_FILTERS = {
  new: {
    technician: null,
    technicianResponseStatus: "pending",
  },

  accepted: {
    technicianResponseStatus: "accepted",
    status: "technician_assigned",
  },

  active: {
    technicianResponseStatus: "accepted",
    status: {
      $in: [
        "technician_on_the_way",
        "technician_arrived",
        "inspection_completed",
        "repair_in_progress",
      ],
    },
  },

  completed: {
    status: "completed",
  },
};

export const getPartnerJobs = async (req, res) => {
  try {
    const filterKey = req.query.status;
    const extraFilter = STATUS_FILTERS[filterKey] || {};

    const bookings = await Booking.find({
      ...extraFilter,
      $or: [
        {
          offeredTechnicians: req.user._id,
          technician: null,
        },
        {
          technician: req.user._id,
        },
      ],
    })
      .populate("service", "name slug visitFee")
      .populate("customer", "fullName phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get partner jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch jobs",
    });
  }
};

export const getPartnerJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const booking = await Booking.findOne({ _id: id, technician: req.user._id })
      .populate("service", "name slug visitFee estimatedCostMin estimatedCostMax")
      .populate("customer", "fullName phone");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const payment = await Payment.findOne({ booking: booking._id }).select(
      "amount status paidAt"
    );

    return res.status(200).json({
      success: true,
      booking: {
        ...booking.toObject(),
        visitFeePaid: payment?.status === "paid" ? payment.amount : null,
      },
    });
  } catch (error) {
    console.error("Get partner job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch job",
    });
  }
};

// ======================================================
// ACCEPT / REJECT A JOB REQUEST
// ======================================================

export const acceptJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Atomic acceptance:
    // Only the first eligible partner can claim the booking.
    const booking = await Booking.findOneAndUpdate(
      {
        _id: id,
        technician: null,
        status: "confirmed",
        technicianResponseStatus: "pending",
        offeredTechnicians: req.user._id,
      },
      {
        $set: {
          technician: req.user._id,
          technicianResponseStatus: "accepted",
          status: "technician_assigned",
        },
      },
      {
        new: true,
      }
    )
      .populate(
        "service",
        "name slug visitFee estimatedCostMin estimatedCostMax"
      )
      .populate("customer", "fullName phone");

    if (!booking) {
      return res.status(409).json({
        success: false,
        message:
          "This request is no longer available. Another partner may have accepted it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job accepted",
      booking,
    });
  } catch (error) {
    console.error("Accept job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to accept job",
    });
  }
};

export const rejectJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Remove this partner from the broadcast offer.
    // Other eligible partners can still accept the booking.
    const booking = await Booking.findOneAndUpdate(
      {
        _id: id,
        technician: null,
        technicianResponseStatus: "pending",
        offeredTechnicians: req.user._id,
      },
      {
        $addToSet: {
          rejectedTechnicians: req.user._id,
        },
        $pull: {
          offeredTechnicians: req.user._id,
        },
      },
      {
        new: true,
      }
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message: "This request is no longer available",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job declined",
    });
  } catch (error) {
    console.error("Reject job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to decline job",
    });
  }
};
// ======================================================
// SERVICE FLOW — advance an accepted job through its steps
// (POST /api/partner/jobs/:id/status)
//
// action:
//   "start_travel" → technician_on_the_way   (Visit Customer)
//   "arrived"      → technician_arrived      (Arrived at location)
//   "give_estimate"→ inspection_completed    (Inspect & Give Estimate; body.amount required)
//   "start_service"→ repair_in_progress      (Start Service)
//   "complete"     → completed               (Complete Service; marks repair payment received)
// ======================================================

const NEXT_STATUS = {
  start_travel: { from: "technician_assigned", to: "technician_on_the_way" },
  arrived: { from: "technician_on_the_way", to: "technician_arrived" },
  give_estimate: { from: "technician_arrived", to: "inspection_completed" },
  start_service: { from: "inspection_completed", to: "repair_in_progress" },
  complete: { from: "repair_in_progress", to: "completed" },
};

 export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, amount } = req.body;

    if (!isObjectId(id)) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const transition = NEXT_STATUS[action];

    if (!transition) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    const booking = await Booking.findOne({
      _id: id,
      technician: req.user._id,
      technicianResponseStatus: "accepted",
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (booking.status !== transition.from) {
      return res.status(400).json({
        success: false,
        message: `This job is not ready for that step (currently: ${booking.status.replaceAll(
          "_",
          " "
        )})`,
      });
    }

    if (action === "give_estimate") {
      const value = Number(amount);
      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid estimate amount",
        });
      }
      booking.finalRepairAmount = value;
    }

    booking.status = transition.to;

    if (action === "complete") {
      booking.repairPaymentStatus = "paid_to_technician";

      const technician = await Technician.findOne({ user: req.user._id });
      // No separate counter needed — completed-job count & earnings are
      // derived live from Booking in the dashboard/earnings endpoints.
      void technician;
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Job updated",
      booking,
    });
  } catch (error) {
    console.error("Update job status error:", error);

    return res.status(500).json({ success: false, message: "Unable to update job" });
  }
};

// ======================================================
// PARTNER EARNINGS   (GET /api/partner/earnings)
// ======================================================

export const getPartnerEarnings = async (req, res) => {
  try {
    const technicianUserId = req.user._id;

    const completedBookings = await Booking.find({
      technician: technicianUserId,
      status: "completed",
    })
      .populate("service", "name")
      .sort({ updatedAt: -1 });

    const paidBookings = completedBookings.filter(
      (b) => b.repairPaymentStatus === "paid_to_technician" && b.finalRepairAmount != null
    );

    const totalEarnings = paidBookings.reduce((sum, b) => sum + (b.finalRepairAmount || 0), 0);
    const completedCount = completedBookings.length;
    const avgPerJob = paidBookings.length
      ? Math.round(totalEarnings / paidBookings.length)
      : 0;

    // This calendar month only, for the headline figure.
    const now = new Date();
    const monthEarnings = paidBookings
      .filter((b) => {
        const d = new Date(b.updatedAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, b) => sum + (b.finalRepairAmount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        monthEarnings,
        completedCount,
        avgPerJob,
        recentPayments: completedBookings.slice(0, 10).map((b) => ({
          id: b._id,
          serviceName: b.service?.name || "Service",
          amount: b.finalRepairAmount,
          status:
            b.repairPaymentStatus === "paid_to_technician" ? "Completed" : "Pending",
          date: b.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Partner earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load earnings",
    });
  }
};



  



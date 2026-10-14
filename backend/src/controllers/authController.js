import crypto from "crypto";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

import User from "../models/User.js";
import PasswordReset from "../models/PasswordReset.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import {
  INDIAN_MOBILE,
  issuePhoneOtp,
  checkPhoneOtp,
  consumePhoneOtp,
} from "../services/phoneOtpService.js";

// ======================================================
// SEND MOBILE VERIFICATION CODE   (POST /api/auth/send-verification-code)
// Body: { phone }. Sends a 6-digit OTP by SMS.
// ======================================================

const publicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  address: user.address,
  pincode: user.pincode,
  role: user.role,
  isVerified: user.isVerified,
});

export const sendVerificationCode = async (req, res) => {
  try {
    const phone =
      typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (!INDIAN_MOBILE.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number",
      });
    }

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Mobile number is already registered",
      });
    }

    const result = await issuePhoneOtp(phone);

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Send verification code error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code",
    });
  }
};

// ======================================================
// VERIFY MOBILE CODE   (POST /api/auth/verify-verification-code)
// Body: { phone, verificationCode }
// ======================================================

export const verifyVerificationCode = async (req, res) => {
  try {
    const phone =
      typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    const code =
      typeof req.body.verificationCode === "string"
        ? req.body.verificationCode.trim()
        : "";

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and verification code are required",
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be 6 digits",
      });
    }

    const result = await checkPhoneOtp(phone, code);

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      message: "Mobile number verified successfully",
    });
  } catch (error) {
    console.error("Verify verification code error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify verification code",
    });
  }
};

// ======================================================
// REGISTER USER   (POST /api/auth/register)
// The mobile OTP is re-checked here, and on success the user is logged in
// straight away (token returned) - no separate login step after sign-up.
// ======================================================

export const registerUser = async (req, res) => {
  try {
    let { fullName, email, verificationCode, phone, address, pincode, password } =
      req.body;

    fullName = typeof fullName === "string" ? fullName.trim() : "";
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    verificationCode =
      typeof verificationCode === "string" ? verificationCode.trim() : "";
    phone = typeof phone === "string" ? phone.trim() : "";
    address = typeof address === "string" ? address.trim() : "";
    pincode = typeof pincode === "string" ? pincode.trim() : "";

    if (
      !fullName ||
      !email ||
      !verificationCode ||
      !phone ||
      !address ||
      !pincode ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be 6 digits",
      });
    }

    if (!INDIAN_MOBILE.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Indian mobile number",
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

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.phone === phone
            ? "Mobile number is already registered"
            : "Email is already registered",
      });
    }

    // Verify the mobile OTP on the server (never trust the client's word)
    const otpResult = await checkPhoneOtp(phone, verificationCode);

    if (!otpResult.ok) {
      return res
        .status(otpResult.status)
        .json({ success: false, message: otpResult.message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      phone,
      address,
      pincode,
      password: hashedPassword,
      role: "customer",
      isVerified: true, // the mobile number was verified by OTP
    });

    await consumePhoneOtp(otpResult.record);

    // Log the new user in immediately
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      data: publicUser(user),
    });
  } catch (error) {
    // Duplicate key (two requests racing, or a stale unique index)
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          field === "phone"
            ? "Mobile number is already registered"
            : "Email is already registered",
      });
    }

    console.error("Register user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

// ======================================================
// LOGIN USER   (POST /api/auth/login)
// Body: { identifier, password }  - identifier = email OR mobile number.
// ({ email, password } still works for older clients.)
// ======================================================

export const loginUser = async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier ?? req.body.email;
    const identifier =
      typeof rawIdentifier === "string" ? rawIdentifier.trim().toLowerCase() : "";
    const password = req.body.password;

    if (!identifier || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
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
      data: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// ======================================================
// UPDATE PROFILE
// ======================================================

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let { fullName, phone, address, pincode } = req.body;

    if (fullName !== undefined) {
      fullName = fullName.trim();

      if (fullName.length < 2 || fullName.length > 60) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 60 characters",
        });
      }

      user.fullName = fullName;
    }

    if (phone !== undefined) {
      phone = phone.trim();

      if (!/^[6-9][0-9]{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid Indian mobile number",
        });
      }

      const existingPhone = await User.findOne({
        phone,
        _id: { $ne: user._id },
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "Phone number is already registered",
        });
      }

      user.phone = phone;
    }

    if (address !== undefined) {
      address = address.trim();

      if (address.length < 5 || address.length > 250) {
        return res.status(400).json({
          success: false,
          message: "Address must be between 5 and 250 characters",
        });
      }

      user.address = address;
    }

    if (pincode !== undefined) {
      pincode = pincode.trim();

      if (!/^[0-9]{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 6 digit pincode",
        });
      }

      user.pincode = pincode;
    }

    await user.save();

    const updated = user.toObject();
    delete updated.password;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// ======================================================
// ADD SAVED ADDRESS  (POST /api/auth/addresses)
// An extra location (work, a relative's place, etc.) — separate from the
// account's primary Home address.
// ======================================================

export const addAddress = async (req, res) => {
  try {
    let { label, address, pincode, latitude, longitude } = req.body;

    label = typeof label === "string" ? label.trim() : "";
    address = typeof address === "string" ? address.trim() : "";
    pincode = typeof pincode === "string" ? pincode.trim() : "";

    if (!label || label.length > 30) {
      return res.status(400).json({
        success: false,
        message: "Please give this address a short label",
      });
    }

    if (address.length < 5 || address.length > 250) {
      return res.status(400).json({
        success: false,
        message: "Address must be between 5 and 250 characters",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6 digit pincode",
      });
    }

    const entry = { label, address, pincode };

    if (typeof latitude === "number" && typeof longitude === "number") {
      entry.latitude = latitude;
      entry.longitude = longitude;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { addresses: entry } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Address added",
      data: user,
    });
  } catch (error) {
    console.error("Add address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add address",
    });
  }
};

// ======================================================
// DELETE SAVED ADDRESS  (DELETE /api/auth/addresses/:addressId)
// ======================================================

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: { _id: req.params.addressId } } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address removed",
      data: user,
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove address",
    });
  }
};

// ======================================================
// GET PROFILE
// ======================================================

export const getProfile = async (req, res) => {
  try {
    const user =
      await User.findById(req.user._id)
        .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "Get profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to get profile",
    });
  }
};

// ======================================================
// FORGOT PASSWORD  (POST /api/auth/forgot-password)
// Body: { email }. Sends a 6-digit code to the email if an account exists.
// Always answers with the same message so it can't be used to find out
// which emails are registered.
// ======================================================

const hashOtp = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

export const forgotPassword = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an account exists for this email, a reset code has been sent.",
  };

  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const existing = await PasswordReset.findOne({ email });

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

    const code = crypto.randomInt(100000, 1000000).toString();

    await PasswordReset.findOneAndUpdate(
      { email },
      {
        email,
        otpHash: hashOtp(code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // DEVELOPMENT ONLY: print the code instead of e-mailing it
    if (
      process.env.DEV_LOG_OTP === "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.log(`🔑 [DEV] Password reset code for ${email}: ${code}`);
      return res.status(200).json({ ...genericResponse, devOtp: code });
    }

    try {
      await sendPasswordResetEmail(email, code);
    } catch (mailError) {
      console.error("Forgot password email error:", mailError);
      await PasswordReset.deleteOne({ email });
      return res.status(500).json({
        success: false,
        message: "Unable to send reset code. Please try again.",
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process request",
    });
  }
};

// ======================================================
// RESET PASSWORD  (POST /api/auth/reset-password)
// Body: { email, code, newPassword }
// ======================================================

export const resetPassword = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const code =
      typeof req.body.code === "string" ? req.body.code.trim() : "";
    const newPassword =
      typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code and new password are required",
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Code must be 6 digits",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const reset = await PasswordReset.findOne({ email });

    if (!reset) {
      return res.status(400).json({
        success: false,
        message: "Reset code not found. Please request a new code.",
      });
    }

    if (reset.expiresAt < new Date()) {
      await PasswordReset.deleteOne({ _id: reset._id });
      return res.status(400).json({
        success: false,
        message: "Reset code has expired. Please request a new code.",
      });
    }

    if (reset.attempts >= 5) {
      await PasswordReset.deleteOne({ _id: reset._id });
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const submitted = Buffer.from(hashOtp(code));
    const stored = Buffer.from(reset.otpHash);

    if (
      submitted.length !== stored.length ||
      !crypto.timingSafeEqual(submitted, stored)
    ) {
      reset.attempts += 1;
      await reset.save();
      return res.status(400).json({
        success: false,
        message: "Invalid reset code",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      await PasswordReset.deleteOne({ _id: reset._id });
      return res.status(400).json({
        success: false,
        message: "Reset code not found. Please request a new code.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await PasswordReset.deleteOne({ _id: reset._id });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};
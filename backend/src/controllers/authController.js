import crypto from "crypto";
import dns from "dns/promises";

import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import { sendVerificationEmail } from "../services/emailService.js";


// ======================================================
// SEND EMAIL VERIFICATION CODE
// ======================================================

export const sendVerificationCode = async (req, res) => {
  try {
    let { email } = req.body;

    // ------------------------------------------
    // Check email exists
    // ------------------------------------------

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // ------------------------------------------
    // Validate email format
    // ------------------------------------------

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // ------------------------------------------
    // Check if email already registered
    // ------------------------------------------

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // ------------------------------------------
    // Check email domain
    // ------------------------------------------

    const domain = email.split("@")[1];

    try {
      const mxRecords = await dns.resolveMx(domain);

      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Email domain cannot receive emails",
        });
      }
    } catch (dnsError) {
      return res.status(400).json({
        success: false,
        message: "Please use a valid email domain",
      });
    }

    // ------------------------------------------
    // Check previous OTP request
    // ------------------------------------------

    const existingVerification = await EmailVerification.findOne({
      email,
    });

    if (existingVerification) {
      const secondsSinceLastSent =
        (Date.now() - existingVerification.lastSentAt.getTime()) / 1000;

      // Allow one OTP every 60 seconds
      if (secondsSinceLastSent < 60) {
        const remainingSeconds = Math.ceil(
          60 - secondsSinceLastSent
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another code`,
        });
      }
    }

    // ------------------------------------------
    // Generate secure 6-digit OTP
    // ------------------------------------------

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    // ------------------------------------------
    // Hash OTP before storing
    // ------------------------------------------

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // ------------------------------------------
    // OTP expires after 10 minutes
    // ------------------------------------------

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // ------------------------------------------
    // Save OTP
    // ------------------------------------------

    await EmailVerification.findOneAndUpdate(
      { email },
      {
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ------------------------------------------
    // Send email using Resend
    // ------------------------------------------

    await sendVerificationEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
    });

  } catch (error) {
    console.error(
      "Send verification code error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code",
    });
  }
};


// ======================================================
// REGISTER USER
// ======================================================

export const registerUser = async (req, res) => {
  try {
    let {
      fullName,
      email,
      phone,
      address,
      pincode,
      password,
      verificationCode,
    } = req.body;

    // ------------------------------------------
    // Normalize values
    // ------------------------------------------

    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();
    address = address?.trim();
    pincode = pincode?.trim();
    verificationCode = verificationCode?.trim();

    // ------------------------------------------
    // Required fields
    // ------------------------------------------

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !pincode ||
      !password ||
      !verificationCode
    ) {
      return res.status(400).json({
        success: false,
        message: "All registration fields are required",
      });
    }

    // ------------------------------------------
    // Validate name
    // ------------------------------------------

    const nameRegex =
      /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;

    if (
      fullName.length < 2 ||
      fullName.length > 60 ||
      !nameRegex.test(fullName)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid full name",
      });
    }

    // ------------------------------------------
    // Validate email
    // ------------------------------------------

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // ------------------------------------------
    // Validate phone
    // Must start with 6-9
    // Exactly 10 digits
    // ------------------------------------------

    const phoneRegex = /^[6-9][0-9]{9}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9",
      });
    }

    // ------------------------------------------
    // Validate pincode
    // ------------------------------------------

    const pincodeRegex = /^[0-9]{6}$/;

    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be exactly 6 digits",
      });
    }

    // ------------------------------------------
    // Validate password
    // Minimum 8 characters
    // At least one number
    // At least one special character
    // ------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least one number",
      });
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least one special character",
      });
    }

    // ------------------------------------------
    // Validate verification code
    // ------------------------------------------

    if (!/^[0-9]{6}$/.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code must be exactly 6 digits",
      });
    }

    // ------------------------------------------
    // Check existing user
    // ------------------------------------------

    const existingUser = await User.findOne({
      $or: [
        { email },
        { phone },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email or phone number already exists",
      });
    }

    // ------------------------------------------
    // Find OTP record
    // ------------------------------------------

    const verification =
      await EmailVerification.findOne({ email });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code not found. Please request a new code",
      });
    }

    // ------------------------------------------
    // Check OTP expiry
    // ------------------------------------------

    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({
        email,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code",
      });
    }

    // ------------------------------------------
    // Limit OTP attempts
    // ------------------------------------------

    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({
        email,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new code",
      });
    }

    // ------------------------------------------
    // Hash submitted OTP
    // ------------------------------------------

    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    // ------------------------------------------
    // Compare OTP
    // ------------------------------------------

    if (
      submittedOtpHash !== verification.otpHash
    ) {
      verification.attempts += 1;
      await verification.save();

      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    // ------------------------------------------
    // Hash password
    // ------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 12);

    // ------------------------------------------
    // Create user
    // ------------------------------------------

    const user = await User.create({
      fullName,
      email,
      phone,
      address,
      pincode,
      password: hashedPassword,
      role: "customer",
      isVerified: true,
    });

    // ------------------------------------------
    // Delete OTP after successful registration
    // ------------------------------------------

    await EmailVerification.deleteOne({
      email,
    });

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        pincode: user.pincode,
        role: user.role,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error(
      "Register user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};


// ======================================================
// LOGIN USER
// ======================================================

export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token = generateToken(
      user._id,
      user.role
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        pincode: user.pincode,
        role: user.role,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};


// ======================================================
// GET LOGGED-IN USER PROFILE
// ======================================================

export const getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};
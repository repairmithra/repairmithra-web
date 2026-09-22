import crypto from "crypto";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

import User from "../models/User.js";
import EmailVerification from "../models/EmailVerification.js";

// ======================================================
// SEND VERIFICATION CODE
// ======================================================

export const sendVerificationCode = async (req, res) => {
  try {
    let { email } = req.body;

    email = email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    // Check existing OTP
    const existingVerification =
      await EmailVerification.findOne({ email });

    if (existingVerification) {
      const now = new Date();

      const timeSinceLastSent =
        now.getTime() -
        new Date(existingVerification.lastSentAt).getTime();

      const cooldown = 60 * 1000;

      if (timeSinceLastSent < cooldown) {
        const remainingSeconds = Math.ceil(
          (cooldown - timeSinceLastSent) / 1000
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another code.`,
        });
      }
    }

    // Generate 6 digit OTP
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Hash OTP
    const otpHash = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

    // OTP expires after 10 minutes
    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    if (existingVerification) {
      existingVerification.otpHash = otpHash;
      existingVerification.expiresAt = expiresAt;
      existingVerification.attempts = 0;
      existingVerification.lastSentAt = new Date();

      await existingVerification.save();
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
    // DEVELOPMENT ONLY: show the code in this terminal instead of e-mailing
    // it, so you can register without a Resend account.
    // Needs DEV_LOG_OTP=true in .env, and is ignored when NODE_ENV=production.
    // --------------------------------------------------

    if (
      process.env.DEV_LOG_OTP === "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      console.log(
        `🔑 [DEV] Verification code for ${email}: ${verificationCode}`
      );

      return res.status(200).json({
        success: true,
        message: "Verification code sent successfully",
      });
    }

    // --------------------------------------------------
    // SEND EMAIL
    // --------------------------------------------------

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // .env uses EMAIL_FROM (RESEND_FROM_EMAIL kept as an alias)
          from:
            process.env.EMAIL_FROM ||
            process.env.RESEND_FROM_EMAIL ||
            "RepairMithra <noreply@repairmithra.com>",
          to: [email],
          subject: "RepairMithra Email Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>RepairMithra Email Verification</h2>

              <p>Your verification code is:</p>

              <h1
                style="
                  letter-spacing: 6px;
                  font-size: 32px;
                "
              >
                ${verificationCode}
              </h1>

              <p>
                This code will expire in 10 minutes.
              </p>

              <p>
                If you did not request this code,
                you can ignore this email.
              </p>
            </div>
          `,
        }),
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        "Resend email error:",
        resendData
      );

      return res.status(500).json({
        success: false,
        message: "Unable to send verification code",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
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
// VERIFY EMAIL VERIFICATION CODE
// ======================================================

export const verifyVerificationCode = async (
  req,
  res
) => {
  try {
    let { email, verificationCode } = req.body;

    email = email?.trim().toLowerCase();
    verificationCode = verificationCode?.trim();

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message:
          "Email and verification code are required",
      });
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code must be 6 digits",
      });
    }

    const verification =
      await EmailVerification.findOne({ email });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code not found. Please request a new code.",
      });
    }

    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code.",
      });
    }

    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new code.",
      });
    }

    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

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

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error(
      "Verify verification code error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify verification code",
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
      verificationCode,
      phone,
      address,
      pincode,
      password,
    } = req.body;

    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();
    verificationCode =
      verificationCode?.trim();
    phone = phone?.trim();
    address = address?.trim();
    pincode = pincode?.trim();

    if (
      !fullName ||
      !email ||
      !verificationCode ||
      !phone ||
      !address ||
      !pincode ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code must be 6 digits",
      });
    }

    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Indian mobile number",
      });
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 6 digit pincode",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters",
      });
    }

    // Check existing user
    const existingUser =
      await User.findOne({
        $or: [
          { email },
          { phone },
        ],
      });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }

      if (existingUser.phone === phone) {
        return res.status(409).json({
          success: false,
          message:
            "Phone number is already registered",
        });
      }
    }

    // Find OTP
    const verification =
      await EmailVerification.findOne({ email });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code not found. Please request a new code.",
      });
    }

    // Check expiry
    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code.",
      });
    }

    // Check attempts
    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect attempts. Please request a new code.",
      });
    }

    // Verify OTP again on server
    const submittedOtpHash = crypto
      .createHash("sha256")
      .update(verificationCode)
      .digest("hex");

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

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create user
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

    // Delete OTP after successful registration
    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
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

    const user =
      await User.findOne({ email });

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

    // Generate JWT token
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
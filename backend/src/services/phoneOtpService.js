import crypto from "crypto";

import PhoneVerification from "../models/PhoneVerification.js";
import { sendOtpSms } from "./smsService.js";

// Shared mobile-OTP logic for customer AND partner registration.

const OTP_TTL_MS = 10 * 60 * 1000; // code is valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between SMS
const MAX_ATTEMPTS = 5;

export const INDIAN_MOBILE = /^[6-9][0-9]{9}$/;

const hashOtp = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const devMode = () =>
  process.env.DEV_LOG_OTP === "true" && process.env.NODE_ENV !== "production";

// ------------------------------------------------------
// Create + send a code.
// Returns { status, body } so controllers can just res.status().json().
// ------------------------------------------------------
export const issuePhoneOtp = async (phone) => {
  const existing = await PhoneVerification.findOne({ phone });

  if (existing) {
    const sinceLast = Date.now() - new Date(existing.lastSentAt).getTime();

    if (sinceLast < RESEND_COOLDOWN_MS) {
      return {
        status: 429,
        body: {
          success: false,
          message: `Please wait ${Math.ceil(
            (RESEND_COOLDOWN_MS - sinceLast) / 1000
          )} seconds before requesting another code.`,
        },
      };
    }
  }

  const code = crypto.randomInt(100000, 1000000).toString();

  await PhoneVerification.findOneAndUpdate(
    { phone },
    {
      phone,
      otpHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      attempts: 0,
      lastSentAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Development shortcut: print the code instead of sending an SMS.
  // Only active when DEV_LOG_OTP=true (and NODE_ENV is not "production").
  if (devMode()) {
    console.log(`🔑 [DEV] Mobile verification code for ${phone}: ${code}`);

    return {
      status: 200,
      body: {
        success: true,
        message: "Verification code generated (dev mode, no SMS sent)",
        devOtp: code,
      },
    };
  }

  try {
    await sendOtpSms(phone, code);
  } catch (error) {
    console.error("Send OTP SMS error:", error.message);
    await PhoneVerification.deleteOne({ phone });

    return {
      status: 502,
      body: {
        success: false,
        message: "Unable to send the SMS right now. Please try again.",
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      message: "Verification code sent to your mobile number",
    },
  };
};

// ------------------------------------------------------
// Check a code. Returns { ok: true, record } on success,
// or { ok: false, status, message } on failure.
// The record is NOT deleted here - call consumePhoneOtp() after the
// account has been created so the code can't be reused.
// ------------------------------------------------------
export const checkPhoneOtp = async (phone, code) => {
  const record = await PhoneVerification.findOne({ phone });

  if (!record) {
    return {
      ok: false,
      status: 400,
      message: "Verification code not found. Please request a new code.",
    };
  }

  if (record.expiresAt < new Date()) {
    await PhoneVerification.deleteOne({ _id: record._id });
    return {
      ok: false,
      status: 400,
      message: "Verification code has expired. Please request a new code.",
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await PhoneVerification.deleteOne({ _id: record._id });
    return {
      ok: false,
      status: 429,
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  const submitted = Buffer.from(hashOtp(code));
  const stored = Buffer.from(record.otpHash);

  if (
    submitted.length !== stored.length ||
    !crypto.timingSafeEqual(submitted, stored)
  ) {
    record.attempts += 1;
    await record.save();
    return { ok: false, status: 400, message: "Invalid verification code" };
  }

  return { ok: true, record };
};

export const consumePhoneOtp = (record) =>
  PhoneVerification.deleteOne({ _id: record._id });

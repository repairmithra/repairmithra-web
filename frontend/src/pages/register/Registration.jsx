import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";

const API_BASE = "http://localhost:5000";

function Registration() {
  const navigate = useNavigate();

  // ======================================================
  // FORM DATA
  // ======================================================

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    verificationCode: "",
    phone: "",
    address: "",
    pincode: "",
    password: "",
    confirmPassword: "",
  });

  // ======================================================
  // UI STATES
  // ======================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [serverError, setServerError] =
    useState("");

  const [isSendingCode, setIsSendingCode] =
    useState(false);

  const [isVerifyingCode, setIsVerifyingCode] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [codeSent, setCodeSent] =
    useState(false);

  const [otpVerified, setOtpVerified] =
    useState(false);

  const [resendCountdown, setResendCountdown] =
    useState(0);

  // ======================================================
  // RESEND COUNTDOWN
  // ======================================================

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // ======================================================
  // HANDLE INPUT CHANGE
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear field error
    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }

    // --------------------------------------------------
    // EMAIL CHANGED
    // --------------------------------------------------

    if (name === "email") {
      setCodeSent(false);
      setOtpVerified(false);
      setResendCountdown(0);

      setFormData((previous) => ({
        ...previous,
        email: value,
        verificationCode: "",
      }));
    }

    // --------------------------------------------------
    // OTP CHANGED
    // --------------------------------------------------

    if (name === "verificationCode") {
      setOtpVerified(false);
    }
  };

  // ======================================================
  // EMAIL VALIDATION
  // ======================================================

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
      email.trim()
    );
  };

  // ======================================================
  // SEND OTP
  // ======================================================

  const sendVerificationCode = async () => {
    const email = formData.email.trim();

    // Don't send during countdown
    if (resendCountdown > 0) {
      return;
    }

    // Validate email
    if (!email) {
      setErrors((previous) => ({
        ...previous,
        email: "Enter your email address first",
      }));

      return;
    }

    if (!isValidEmail(email)) {
      setErrors((previous) => ({
        ...previous,
        email: "Enter a valid email address",
      }));

      return;
    }

    setIsSendingCode(true);
    setServerError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/send-verification-code`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.toLowerCase(),
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to send verification code"
        );
      }

      // OTP sent
      setCodeSent(true);

      // New OTP means previous verification is invalid
      setOtpVerified(false);

      // Clear previous OTP
      setFormData((previous) => ({
        ...previous,
        verificationCode: "",
      }));

      setErrors((previous) => ({
        ...previous,
        email: "",
        verificationCode: "",
      }));

      // 60 second resend timer
      setResendCountdown(60);
    } catch (error) {
      console.error(
        "Send OTP error:",
        error
      );

      setServerError(
        error.message ||
          "Unable to send verification code"
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  // ======================================================
  // VERIFY OTP
  // ======================================================

  const verifyVerificationCode = async () => {
    const email =
      formData.email.trim().toLowerCase();

    const verificationCode =
      formData.verificationCode.trim();

    if (!verificationCode) {
      setErrors((previous) => ({
        ...previous,
        verificationCode:
          "Enter the verification code",
      }));

      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      setErrors((previous) => ({
        ...previous,
        verificationCode:
          "Verification code must be 6 digits",
      }));

      return;
    }

    setIsVerifyingCode(true);
    setServerError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/verify-verification-code`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            verificationCode,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Invalid verification code"
        );
      }

      // ------------------------------------------
      // SUCCESS
      // ------------------------------------------

      setOtpVerified(true);

      setErrors((previous) => ({
        ...previous,
        verificationCode: "",
      }));
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error
      );

      setOtpVerified(false);

      setErrors((previous) => ({
        ...previous,
        verificationCode:
          error.message ||
          "Invalid verification code",
      }));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // ======================================================
  // VALIDATE COMPLETE FORM
  // ======================================================

  const validateForm = () => {
    const newErrors = {};

    // ------------------------------------------
    // FULL NAME
    // ------------------------------------------

    const nameRegex =
      /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        "Full name is required";
    } else if (
      formData.fullName.trim().length < 2
    ) {
      newErrors.fullName =
        "Enter a valid name";
    } else if (
      !nameRegex.test(
        formData.fullName.trim()
      )
    ) {
      newErrors.fullName =
        "Name should contain letters and spaces only";
    }

    // ------------------------------------------
    // EMAIL
    // ------------------------------------------

    if (!formData.email.trim()) {
      newErrors.email =
        "Email address is required";
    } else if (
      !isValidEmail(formData.email)
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    // ------------------------------------------
    // OTP
    // ------------------------------------------

    if (!codeSent) {
      newErrors.verificationCode =
        "Please send OTP first";
    } else if (!otpVerified) {
      newErrors.verificationCode =
        "Please verify your email first";
    }

    // ------------------------------------------
    // PHONE
    // ------------------------------------------

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required";
    } else if (
      !/^[6-9]\d{9}$/.test(
        formData.phone.trim()
      )
    ) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number";
    }

    // ------------------------------------------
    // ADDRESS
    // ------------------------------------------

    if (!formData.address.trim()) {
      newErrors.address =
        "Address is required";
    } else if (
      formData.address.trim().length < 5
    ) {
      newErrors.address =
        "Enter a valid address";
    }

    // ------------------------------------------
    // PINCODE
    // ------------------------------------------

    if (!formData.pincode.trim()) {
      newErrors.pincode =
        "Pincode is required";
    } else if (
      !/^\d{6}$/.test(
        formData.pincode.trim()
      )
    ) {
      newErrors.pincode =
        "Enter a valid 6-digit pincode";
    }

    // ------------------------------------------
    // PASSWORD
    // ------------------------------------------

    if (!formData.password) {
      newErrors.password =
        "Password is required";
    } else if (
      formData.password.length < 8
    ) {
      newErrors.password =
        "Password must be at least 8 characters";
    } else if (
      !/[0-9]/.test(formData.password)
    ) {
      newErrors.password =
        "Password must contain at least 1 number";
    } else if (
      !/[!@#$%^&*(),.?":{}|<>_\-]/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must contain at least 1 special character";
    }

    // ------------------------------------------
    // CONFIRM PASSWORD
    // ------------------------------------------

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (
      formData.password !==
      formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // ======================================================
  // CREATE ACCOUNT
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fullName:
              formData.fullName.trim(),

            email:
              formData.email
                .trim()
                .toLowerCase(),

            verificationCode:
              formData.verificationCode,

            phone:
              formData.phone.trim(),

            address:
              formData.address.trim(),

            pincode:
              formData.pincode.trim(),

            password:
              formData.password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Registration failed"
        );
      }

      // ------------------------------------------
      // SUCCESS
      // ------------------------------------------

      alert(
        "Account created successfully!"
      );

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. Please login.",
        },
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setServerError(
        error.message ||
          "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================
  // INPUT CLASS
  // ======================================================

  const inputClass = (field) => `
    w-full
    h-[54px]
    rounded-[10px]
    border
    bg-white
    px-3
    text-[15px]
    text-[#315d85]
    placeholder:text-[#88a2bd]
    outline-none
    transition
    ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-[#d7e5f2] focus:border-[#1478e8] focus:ring-2 focus:ring-[#1478e8]/10"
    }
  `;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-[#eef6ff] px-4 py-8">

      <div className="mx-auto w-full max-w-[620px]">

        {/* ==========================================
            BACK TO LOGIN
        ========================================== */}

        <div className="mb-5">

          <Link
            to="/login"
            className="
              inline-flex
              items-center
              gap-2
              text-[14px]
              font-semibold
              text-[#1478e8]
              hover:text-[#0d69d0]
            "
          >
            <FiArrowLeft size={16} />
            Back to Login
          </Link>

        </div>

        {/* ==========================================
            CARD
        ========================================== */}

        <div
          className="
            rounded-[18px]
            bg-white
            px-5
            py-7
            shadow-[0_10px_35px_rgba(30,100,160,0.10)]
            sm:px-8
            sm:py-9
          "
        >

          {/* ==========================================
              LOGO
          ========================================== */}

          <div className="mb-7 text-center">

            <img
              src={logo}
              alt="RepairMithra"
              className="
                mx-auto
                h-auto
                w-[155px]
              "
            />

            <h1
              className="
                mt-5
                text-[25px]
                font-bold
                text-[#183b5c]
              "
            >
              Create Your Account
            </h1>

            <p
              className="
                mt-1.5
                text-[14px]
                text-[#7891a8]
              "
            >
              Register with RepairMithra
            </p>

          </div>

          {/* ==========================================
              SERVER ERROR
          ========================================== */}

          {serverError && (
            <div
              className="
                mb-5
                rounded-[9px]
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-[13px]
                text-red-600
              "
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ========================================
                FULL NAME
            ======================================== */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiUser
                  className="
                    absolute
                    left-3
                    top-1/2
                    z-10
                    -translate-y-1/2
                    text-[#6685a5]
                  "
                  size={20}
                />

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name *"
                  autoComplete="name"
                  className={`${inputClass(
                    "fullName"
                  )} pl-[52px]`}
                />

              </div>

              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.fullName}
                </p>
              )}

            </div>

            {/* ========================================
                EMAIL + SEND OTP
            ======================================== */}

            <div className="mb-[15px]">

              <div className="flex items-start gap-2">

                {/* EMAIL */}

                <div className="relative flex-1">

                  <FiMail
                    className="
                      absolute
                      left-3
                      top-1/2
                      z-10
                      -translate-y-1/2
                      text-[#6685a5]
                    "
                    size={20}
                  />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address *"
                    autoComplete="email"
                    className={`${inputClass(
                      "email"
                    )} pl-[52px]`}
                  />

                </div>

                {/* SMALL SEND OTP */}

                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={
                    isSendingCode ||
                    resendCountdown > 0 ||
                    !isValidEmail(
                      formData.email
                    )
                  }
                  className="
                    h-[54px]
                    rounded-[10px]
                    bg-[#1478e8]
                    px-4
                    text-[13px]
                    font-semibold
                    whitespace-nowrap
                    text-white
                    transition
                    hover:bg-[#0d69d0]
                    disabled:cursor-not-allowed
                    disabled:bg-[#b8cce0]
                  "
                >
                  {isSendingCode
                    ? "Sending..."
                    : codeSent
                    ? "Sent"
                    : "Send OTP"}
                </button>

              </div>

              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email}
                </p>
              )}

            </div>

            {/* ========================================
                OTP SECTION
            ======================================== */}

            {codeSent && (
              <div className="mb-[18px]">

                {/* OTP INPUT */}

                <div className="relative">

                  <FiShield
                    className="
                      absolute
                      left-3
                      top-1/2
                      z-10
                      -translate-y-1/2
                      text-[#6685a5]
                    "
                    size={20}
                  />

                  <input
                    type="text"
                    name="verificationCode"
                    value={
                      formData.verificationCode
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ""
                        );

                      if (
                        value.length <= 6
                      ) {
                        setFormData(
                          (previous) => ({
                            ...previous,
                            verificationCode:
                              value,
                          })
                        );

                        setOtpVerified(false);

                        setErrors(
                          (previous) => ({
                            ...previous,
                            verificationCode:
                              "",
                          })
                        );
                      }
                    }}
                    placeholder="Enter 6-digit OTP *"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={`${inputClass(
                      "verificationCode"
                    )} pl-[52px]`}
                  />

                </div>

                {/* VERIFY BUTTON */}

                <button
  type="button"
  onClick={sendVerificationCode}
  disabled={isSendingCode || otpVerified}
>
  {otpVerified
    ? "Email Verified"
    : isSendingCode
    ? "Sending..."
    : "Send OTP"}
</button>

                {/* OTP ERROR */}

                {errors.verificationCode && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {
                      errors.verificationCode
                    }
                  </p>
                )}

                {/* OTP SUCCESS */}

                {otpVerified && (
                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-1.5
                      text-xs
                      text-green-600
                    "
                  >
                    <FiCheckCircle
                      size={14}
                    />

                    <span>
                      Email verified successfully
                    </span>
                  </div>
                )}

                {/* RESEND */}

                {!otpVerified && (
                  <div className="mt-2">

                    {resendCountdown > 0 ? (
                      <span
                        className="
                          text-[13px]
                          text-[#7891a8]
                        "
                      >
                        Resend OTP in{" "}
                        <span className="font-semibold text-[#1478e8]">
                          {resendCountdown}s
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={
                          sendVerificationCode
                        }
                        disabled={
                          isSendingCode
                        }
                        className="
                          text-[13px]
                          font-semibold
                          text-[#1478e8]
                          hover:underline
                          disabled:text-gray-400
                        "
                      >
                        Resend OTP
                      </button>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* ========================================
                PHONE
            ======================================== */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiPhone
                  className="
                    absolute
                    left-3
                    top-1/2
                    z-10
                    -translate-y-1/2
                    text-[#6685a5]
                  "
                  size={20}
                />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    if (
                      value.length <= 10
                    ) {
                      setFormData(
                        (previous) => ({
                          ...previous,
                          phone: value,
                        })
                      );

                      if (errors.phone) {
                        setErrors(
                          (previous) => ({
                            ...previous,
                            phone: "",
                          })
                        );
                      }
                    }
                  }}
                  placeholder="Phone Number *"
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel"
                  className={`${inputClass(
                    "phone"
                  )} pl-[52px]`}
                />

              </div>

              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.phone}
                </p>
              )}

            </div>

            {/* ========================================
                ADDRESS
            ======================================== */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiMapPin
                  className="
                    absolute
                    left-3
                    top-5
                    z-10
                    text-[#6685a5]
                  "
                  size={20}
                />

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address *"
                  rows={3}
                  autoComplete="street-address"
                  className={`
                    w-full
                    rounded-[10px]
                    border
                    bg-white
                    px-3
                    py-4
                    pl-[52px]
                    text-[15px]
                    text-[#315d85]
                    placeholder:text-[#88a2bd]
                    outline-none
                    transition
                    ${
                      errors.address
                        ? "border-red-400"
                        : "border-[#d7e5f2] focus:border-[#1478e8] focus:ring-2 focus:ring-[#1478e8]/10"
                    }
                  `}
                />

              </div>

              {errors.address && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.address}
                </p>
              )}

            </div>

            {/* ========================================
                PINCODE
            ======================================== */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiMapPin
                  className="
                    absolute
                    left-3
                    top-1/2
                    z-10
                    -translate-y-1/2
                    text-[#6685a5]
                  "
                  size={20}
                />

                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    if (
                      value.length <= 6
                    ) {
                      setFormData(
                        (previous) => ({
                          ...previous,
                          pincode: value,
                        })
                      );

                      if (errors.pincode) {
                        setErrors(
                          (previous) => ({
                            ...previous,
                            pincode: "",
                          })
                        );
                      }
                    }
                  }}
                  placeholder="Pincode *"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={`${inputClass(
                    "pincode"
                  )} pl-[52px]`}
                />

              </div>

              {errors.pincode && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.pincode}
                </p>
              )}

            </div>

            {/* ========================================
                PASSWORD
            ======================================== */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiLock
                  className="
                    absolute
                    left-3
                    top-1/2
                    z-10
                    -translate-y-1/2
                    text-[#6685a5]
                  "
                  size={20}
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password *"
                  autoComplete="new-password"
                  className={`${inputClass(
                    "password"
                  )} pl-[52px] pr-[52px]`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-[#6685a5]
                    hover:text-[#1478e8]
                  "
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={19} />
                  ) : (
                    <FiEye size={19} />
                  )}
                </button>

              </div>

              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}

            </div>

            {/* ========================================
                CONFIRM PASSWORD
            ======================================== */}

            <div className="mb-[22px]">

              <div className="relative">

                <FiLock
                  className="
                    absolute
                    left-3
                    top-1/2
                    z-10
                    -translate-y-1/2
                    text-[#6685a5]
                  "
                  size={20}
                />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Confirm Password *"
                  autoComplete="new-password"
                  className={`${inputClass(
                    "confirmPassword"
                  )} pl-[52px] pr-[52px]`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-[#6685a5]
                    hover:text-[#1478e8]
                  "
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={19} />
                  ) : (
                    <FiEye size={19} />
                  )}
                </button>

              </div>

              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">
                  {
                    errors.confirmPassword
                  }
                </p>
              )}

            </div>

            {/* ========================================
                CREATE ACCOUNT
            ======================================== */}

            <button
              type="submit"
              disabled={
                isLoading ||
                !otpVerified
              }
              className="
                flex
                h-[54px]
                w-full
                items-center
                justify-center
                gap-2
                rounded-[10px]
                bg-[#1478e8]
                text-[15px]
                font-bold
                text-white
                shadow-[0_8px_18px_rgba(20,120,232,0.25)]
                transition
                hover:bg-[#0d69d0]
                disabled:cursor-not-allowed
                disabled:bg-[#b8cce0]
                disabled:text-[#6f879e]
              "
            >
              {isLoading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* ==========================================
              LOGIN
          ========================================== */}

          <div
            className="
              mt-6
              text-center
              text-[14px]
              text-[#7891a8]
            "
          >
            Already have an account?{" "}

            <Link
              to="/login"
              className="
                font-semibold
                text-[#1478e8]
                hover:underline
              "
            >
              Login
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Registration;
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
  FiStar,
  FiArrowLeft,
  FiAlertCircle,
} from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";

const API_BASE = "http://localhost:5000";
function Registration() {
  const navigate = useNavigate();

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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const [codeSent, setCodeSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // ==========================================
  // RESEND COUNTDOWN
  // ==========================================

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

  // ==========================================
  // HANDLE CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }

    // If email changes, old OTP is no longer valid
    if (name === "email") {
      setCodeSent(false);
      setResendCountdown(0);

      setFormData((previous) => ({
        ...previous,
        email: value,
        verificationCode: "",
      }));
    }
  };

  // ==========================================
  // VALIDATION
  // ==========================================

  const validate = () => {
    const newErrors = {};

    // ------------------------------------------
    // FULL NAME
    // ------------------------------------------

    const nameRegex =
      /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Enter a valid name";
    } else if (
      !nameRegex.test(formData.fullName.trim())
    ) {
      newErrors.fullName =
        "Name should contain letters and spaces only";
    }

    // ------------------------------------------
    // EMAIL
    // ------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!formData.email.trim()) {
      newErrors.email =
        "Email address is required";
    } else if (
      !emailRegex.test(formData.email.trim())
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    // ------------------------------------------
    // VERIFICATION CODE
    // ------------------------------------------

    if (!codeSent) {
      newErrors.verificationCode =
        "Please send the verification code first";
    } else if (!formData.verificationCode.trim()) {
      newErrors.verificationCode =
        "Email verification code is required";
    } else if (
      !/^\d{6}$/.test(
        formData.verificationCode
      )
    ) {
      newErrors.verificationCode =
        "Verification code must be 6 digits";
    }

    // ------------------------------------------
    // PHONE
    // ------------------------------------------

    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required";
    } else if (
      !/^[6-9]\d{9}$/.test(formData.phone)
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
      !/^\d{6}$/.test(formData.pincode)
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

    return Object.keys(newErrors).length === 0;
  };

  // ==========================================
  // SEND VERIFICATION CODE
  // ==========================================

  const sendVerificationCode = async () => {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const email = formData.email.trim();

    // Don't allow resend during countdown
    if (resendCountdown > 0) {
      return;
    }

    // Validate email first
    if (!email) {
      setErrors((previous) => ({
        ...previous,
        email:
          "Enter your email address first",
      }));
      return;
    }

    if (!emailRegex.test(email)) {
      setErrors((previous) => ({
        ...previous,
        email:
          "Enter a valid email address",
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
            email,
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

      // Code successfully sent
      setCodeSent(true);

      // Clear old OTP
      setFormData((previous) => ({
        ...previous,
        verificationCode: "",
      }));

      setErrors((previous) => ({
        ...previous,
        email: "",
        verificationCode: "",
      }));

      // Start 60 second countdown
      setResendCountdown(60);
    } catch (error) {
      console.error(
        "Verification code error:",
        error
      );

      if (
        error.message === "Failed to fetch"
      ) {
        setServerError(
          "Could not reach the server. Please check your connection and try again."
        );
      } else {
        setServerError(
          error.message ||
            "Unable to send verification code"
        );
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  // ==========================================
  // SUBMIT REGISTRATION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");

    // Frontend validation
    if (!validate()) {
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
              formData.email.trim().toLowerCase(),

            verificationCode:
              formData.verificationCode,

            phone: formData.phone,

            address:
              formData.address.trim(),

            pincode: formData.pincode,

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

      if (
        error.message === "Failed to fetch"
      ) {
        setServerError(
          "Could not reach the server. Please check your connection and try again."
        );
      } else {
        setServerError(
          error.message ||
            "Registration failed"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // INPUT CLASS
  // ==========================================

  const inputClass = (field) =>
    `w-full h-[54px] rounded-[10px] border bg-white
    px-3 text-[15px] text-[#315d85]
    placeholder:text-[#88a2bd]
    outline-none transition
    ${
      errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-[#cddded] focus:border-[#1976ed] focus:ring-2 focus:ring-blue-100"
    }`;

  // ==========================================
  // RETURN UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#eef6ff] flex items-center justify-center p-[30px] relative">

      {/* ======================================
          BACK BUTTON
      ====================================== */}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="
          fixed
          top-6
          left-6
          z-50
          w-11
          h-11
          rounded-full
          bg-white
          border
          border-gray-200
          shadow-md
          flex
          items-center
          justify-center
          text-gray-600
          hover:text-[#1976ed]
          hover:shadow-lg
          transition
        "
        aria-label="Go back"
      >
        <FiArrowLeft size={22} />
      </button>

      {/* ======================================
          MAIN CARD
      ====================================== */}

      <div
        className="
          w-full
          max-w-[1100px]
          min-h-[650px]
          grid
          grid-cols-1
          lg:grid-cols-[48%_52%]
          bg-white
          rounded-[22px]
          overflow-hidden
          shadow-[0_15px_40px_rgba(20,70,120,0.15)]
        "
      >

        {/* ====================================
            LEFT SIDE
        ==================================== */}

        <div
          className="
            relative
            min-h-[400px]
            lg:min-h-[650px]
            p-[32px]
            flex
            flex-col
            justify-between
            bg-cover
            bg-center
          "
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(0,43,92,0.05),
                rgba(0,55,115,0.90)
              ),
              url("/repair-worker.jpg")
            `,
          }}
        >

          {/* LOGO */}

          <Link to="/">
            <img
              src={logo}
              alt="RepairMithra Logo"
              className="
                w-[180px]
                h-auto
                object-contain
              "
            />
          </Link>

          {/* LEFT CONTENT */}

          <div className="mt-auto text-white">

            <h1
              className="
                text-[38px]
                leading-[1.15]
                font-bold
                mb-[18px]
                max-md:text-[27px]
              "
            >
              Your Trusted Home
              <br />
              Repair Partner
            </h1>

            <p
              className="
                text-[17px]
                leading-[1.5]
                mb-[28px]
                max-md:text-[14px]
              "
            >
              Connect with skilled professionals
              <br />
              for reliable and quality home
              <br />
              repair services.
            </p>

            {/* FEATURES */}

            <div
              className="
                flex
                items-center
                gap-6
                max-md:gap-2
              "
            >

              {/* TRUSTED */}

              <div
                className="
                  flex
                  items-center
                  gap-[10px]
                  pr-[22px]
                  border-r
                  border-white/50
                  max-md:pr-[10px]
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-full
                    bg-white
                    text-[#1478e8]
                    flex
                    items-center
                    justify-center
                    shrink-0
                    max-md:w-[35px]
                    max-md:h-[35px]
                  "
                >
                  <FiCheckCircle size={23} />
                </div>

                <span
                  className="
                    text-[14px]
                    font-semibold
                    leading-[1.25]
                    max-md:text-[10px]
                  "
                >
                  Trusted
                  <br />
                  Professionals
                </span>
              </div>

              {/* QUALITY */}

              <div
                className="
                  flex
                  items-center
                  gap-[10px]
                  pr-[22px]
                  border-r
                  border-white/50
                  max-md:pr-[10px]
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-full
                    bg-white
                    text-[#1478e8]
                    flex
                    items-center
                    justify-center
                    shrink-0
                    max-md:w-[35px]
                    max-md:h-[35px]
                  "
                >
                  <FiStar size={23} />
                </div>

                <span
                  className="
                    text-[14px]
                    font-semibold
                    leading-[1.25]
                    max-md:text-[10px]
                  "
                >
                  Quality
                  <br />
                  Services
                </span>
              </div>

              {/* EASY BOOKING */}

              <div
                className="
                  flex
                  items-center
                  gap-[10px]
                "
              >
                <div
                  className="
                    w-12
                    h-12
                    rounded-full
                    bg-white
                    text-[#1478e8]
                    flex
                    items-center
                    justify-center
                    shrink-0
                    max-md:w-[35px]
                    max-md:h-[35px]
                  "
                >
                  <FiCheckCircle size={23} />
                </div>

                <span
                  className="
                    text-[14px]
                    font-semibold
                    leading-[1.25]
                    max-md:text-[10px]
                  "
                >
                  Easy
                  <br />
                  Booking
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ====================================
            RIGHT SIDE
        ==================================== */}

        <div
          className="
            p-[48px_55px]
            overflow-y-auto
            max-md:p-[30px_22px]
          "
        >

          {/* TITLE */}

          <h2
            className="
              text-[#10477e]
              text-[42px]
              leading-[1.1]
              font-bold
              max-md:text-[32px]
            "
          >
            Create Account
          </h2>

          <p
            className="
              text-[#6d8baa]
              text-[17px]
              mt-3
              mb-[26px]
              max-md:text-[14px]
            "
          >
            Join RepairMithra and get started today
          </p>

          {/* SERVER ERROR */}

          {serverError && (
            <div
              className="
                mb-5
                flex
                items-start
                gap-2
                rounded-lg
                bg-red-50
                border
                border-red-200
                px-4
                py-3
                text-sm
                text-red-700
              "
            >
              <FiAlertCircle
                className="mt-0.5 shrink-0"
                size={17}
              />

              <span>
                {serverError}
              </span>
            </div>
          )}

          {/* ==================================
              FORM
          ================================== */}

          <form
            onSubmit={handleSubmit}
            noValidate
          >

            {/* FULL NAME */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiUser
                  className="
                    absolute
                    left-3
                    top-1/2
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

            {/* EMAIL */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiMail
                  className="
                    absolute
                    left-3
                    top-1/2
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

              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email}
                </p>
              )}

            </div>

            {/* EMAIL VERIFICATION CODE */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiShield
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#6685a5]
                    z-10
                  "
                  size={20}
                />

                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    if (value.length <= 6) {
                      setFormData(
                        (previous) => ({
                          ...previous,
                          verificationCode:
                            value,
                        })
                      );

                      if (
                        errors.verificationCode
                      ) {
                        setErrors(
                          (previous) => ({
                            ...previous,
                            verificationCode:
                              "",
                          })
                        );
                      }

                      if (serverError) {
                        setServerError("");
                      }
                    }
                  }}
                  placeholder="Email Verification Code *"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={`${inputClass(
                    "verificationCode"
                  )} pl-[52px] pr-[115px]`}
                />

                {/* SEND / RESEND BUTTON */}

                <button
                  type="button"
                  onClick={
                    sendVerificationCode
                  }
                  disabled={
                    isSendingCode ||
                    resendCountdown > 0
                  }
                  className={`
                    absolute
                    right-2
                    top-1/2
                    -translate-y-1/2
                    font-bold
                    text-xs
                    rounded-[7px]
                    px-3
                    py-2
                    transition
                    ${
                      isSendingCode ||
                      resendCountdown > 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#e9f3ff] text-[#1478e8] hover:bg-[#d9ebff]"
                    }
                  `}
                >
                  {isSendingCode
                    ? "Sending..."
                    : resendCountdown > 0
                    ? `${resendCountdown}s`
                    : codeSent
                    ? "Resend"
                    : "Send Code"}
                </button>

              </div>

              {errors.verificationCode && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.verificationCode}
                </p>
              )}

              {codeSent &&
                !errors.verificationCode && (
                  <p className="mt-1.5 text-xs text-green-600">
                    Verification code sent to your email.
                  </p>
                )}

            </div>

            {/* PHONE */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiPhone
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#6685a5]
                    z-10
                  "
                  size={20}
                />

                <span
                  className="
                    absolute
                    left-[52px]
                    top-1/2
                    -translate-y-1/2
                    text-[15px]
                    text-[#426887]
                    pr-[10px]
                    border-r
                    border-[#d8e3ee]
                    z-10
                  "
                >
                  +91
                </span>

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

                    if (value.length <= 10) {
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
                  )} pl-[105px]`}
                />

              </div>

              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.phone}
                </p>
              )}

            </div>

            {/* ADDRESS */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiMapPin
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-[#6685a5]
                  "
                  size={20}
                />

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address *"
                  autoComplete="street-address"
                  className={`${inputClass(
                    "address"
                  )} pl-[52px]`}
                />

              </div>

              {errors.address && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.address}
                </p>
              )}

            </div>

            {/* PINCODE */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiMapPin
                  className="
                    absolute
                    left-3
                    top-1/2
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

                    if (value.length <= 6) {
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

            {/* PASSWORD */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiLock
                  className="
                    absolute
                    left-3
                    top-1/2
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
                  )} pl-[52px] pr-[50px]`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    bg-transparent
                    text-[#6c8aa7]
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

              <p className="mt-1.5 text-[11px] text-[#7891a8]">
                Minimum 8 characters, including
                1 number and 1 special character.
              </p>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="mb-[15px]">

              <div className="relative">

                <FiLock
                  className="
                    absolute
                    left-3
                    top-1/2
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
                  )} pl-[52px] pr-[50px]`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    bg-transparent
                    text-[#6c8aa7]
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
                  {errors.confirmPassword}
                </p>
              )}

            </div>

            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full
                h-[54px]
                rounded-[10px]
                bg-[#1478e8]
                text-white
                font-bold
                text-[15px]
                flex
                items-center
                justify-center
                gap-2
                shadow-[0_8px_18px_rgba(20,120,232,0.25)]
                hover:bg-[#0d69d0]
                disabled:bg-[#8db8e2]
                disabled:cursor-not-allowed
                transition
              "
            >
              {isLoading
                ? "Creating Account..."
                : "Create Account"}
            </button>

          </form>

          {/* LOGIN */}

          <div
            className="
              text-center
              mt-6
              text-[14px]
              text-[#7891a8]
            "
          >
            Already have an account?{" "}

            <Link
              to="/login"
              className="
                text-[#1478e8]
                font-bold
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
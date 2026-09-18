import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiPhone,
  FiUserPlus,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";

// Allow overriding the API base URL via VITE_API_URL for production builds.
// In dev, requests to "/api/..." are proxied to the backend (see vite.config.js).
const API_BASE = import.meta.env.VITE_API_URL || "";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear the field-level error as the user edits it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) setServerError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Enter your full name";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Unexpected response from server");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create your account");
      }

      setSuccessMessage("Account created! Redirecting to login...");

      // Send the user to the login page after a brief confirmation pause
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setServerError(
        err.message === "Failed to fetch"
          ? "Could not reach the server. Please check your connection and try again."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-4">
            <img
              src={logo}
              alt="RepairMithra"
              className="h-20 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign up to book and track your repairs
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          {serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              <FiCheckCircle className="mt-0.5 shrink-0" size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Full Name */}
            <div className="mb-5">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.fullName
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.phone
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border py-3 pl-10 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border py-3 pl-10 pr-11 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.confirmPassword
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Creating account...
                </>
              ) : (
                <>
                  <FiUserPlus size={18} />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-slate-500 hover:text-slate-700">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
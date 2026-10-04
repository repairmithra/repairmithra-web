import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";
import { setSession, getStoredUser, isTechnician } from "../../utils/auth";
import { API_BASE } from "../../utils/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // This browser only has room for one session (one token in localStorage).
  // If a partner is currently logged in here, logging in as a customer will
  // replace that session — flag it up front so it doesn't look like a bug.
  const existingUser = getStoredUser();
  const switchingFromPartner = isTechnician(existingUser);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = location.state?.from || "/";

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

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {     
   newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
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
        throw new Error(data.message || "Invalid email or password");
      }

      // Save the session. The navbar etc. update straight away.
      setSession(data.token, data.data);

      navigate(redirectTo, { replace: true });
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
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">
            Log in to manage your bookings
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

          {switchingFromPartner && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>
                You're currently signed in as a partner ({existingUser?.fullName || "this device"}) in this browser.
                Logging in here will replace that session — use a different browser or a private window to keep both signed in at once.
              </span>
            </div>
          )}

          {serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

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

            {/* Password */}
            <div className="mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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

            <div className="flex justify-end mb-6">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Logging in...
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  Log In
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign up
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

export default Login;
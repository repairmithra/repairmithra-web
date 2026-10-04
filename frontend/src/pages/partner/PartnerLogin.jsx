import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";
import { setSession, getStoredUser, isTechnician } from "../../utils/auth";
import { ApiError } from "../../utils/api";
import { loginPartner } from "./partnerApi";

function PartnerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  // Same browser, same localStorage token slot: a customer session already
  // sitting here will be replaced the moment partner login succeeds.
  const existingUser = getStoredUser();
  const switchingFromCustomer = existingUser && !isTechnician(existingUser);

  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = location.state?.from || "/partner/dashboard";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError) setServerError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = "Enter your mobile number or email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      const data = await loginPartner(formData.identifier.trim(), formData.password);
      setSession(data.token, data.data);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Unable to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/60 to-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="mb-4">
            <img src={logo} alt="RepairMithra" className="h-20 w-auto object-contain" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Partner Login</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          {switchingFromCustomer && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>
                You're currently signed in as a customer ({existingUser?.fullName || "this device"}) in this browser.
                Logging in here will replace that session — use a different browser or a private window to keep both signed in at once.
              </span>
            </div>
          )}

          {serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-slate-700">
                Mobile / Email
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Mobile number or email"
                  className={`w-full rounded-xl border py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.identifier
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-200"
                  }`}
                />
              </div>
              {errors.identifier && <p className="mt-1.5 text-xs text-red-600">{errors.identifier}</p>}
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
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
                      : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-200"
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
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Remember me
              </label>
              <Link to="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Logging in...
                </>
              ) : (
                <>
                  <FiLogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            New to RepairMithra?{" "}
            <Link to="/partner/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Register as Partner
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

export default PartnerLogin;
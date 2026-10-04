import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiKey,
} from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";
import { apiFetch } from "../../utils/api";

const inputClass = (hasError) =>
  `w-full rounded-xl border py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
    hasError
      ? "border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
  }`;

function ForgotPassword() {
  const navigate = useNavigate();

  // 1 = enter email, 2 = enter code + new password, 3 = done
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const sendCode = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });

      // In development the server returns the code so you can test without
      // sending a real email.
      setInfo(
        data.devOtp
          ? `${data.message} (dev code: ${data.devOtp})`
          : data.message
      );
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: { email: email.trim(), code, newPassword },
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitButton = (label, loadingLabel) => (
    <button
      type="submit"
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-4">
            <img
              src={logo}
              alt="RepairMithra"
              className="h-20 w-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 3 ? "Password updated" : "Forgot password?"}
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            {step === 1 &&
              "Enter your email and we'll send you a 6-digit code"}
            {step === 2 && "Enter the code and choose a new password"}
            {step === 3 && "You can now log in with your new password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={sendCode} noValidate>
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className={inputClass(false)}
                  />
                </div>
              </div>
              {submitButton("Send code", "Sending...")}
            </form>
          )}

          {step === 2 && (
            <form onSubmit={resetPassword} noValidate>
              {info && (
                <div className="mb-5 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  <FiCheckCircle className="mt-0.5 shrink-0" size={16} />
                  <span>{info}</span>
                </div>
              )}

              <div className="mb-5">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Verification code
                </label>
                <div className="relative">
                  <FiKey
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    placeholder="123456"
                    className={`${inputClass(false)} tracking-widest`}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  New password
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="At least 8 characters"
                    className={`${inputClass(false)} pr-11`}
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
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Re-enter new password"
                    className={inputClass(false)}
                  />
                </div>
              </div>

              {submitButton("Reset password", "Resetting...")}

              <button
                type="button"
                onClick={sendCode}
                disabled={isLoading}
                className="mt-4 block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                Didn&apos;t get a code? Resend
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center">
              <FiCheckCircle className="mx-auto mb-4 text-green-500" size={48} />
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5"
              >
                Go to login
              </button>
            </div>
          )}
        </div>

        {step !== 3 && (
          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="text-slate-500 hover:text-slate-700">
              ← Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
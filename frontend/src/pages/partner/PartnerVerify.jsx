import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiAlertCircle, FiArrowLeft, FiInfo } from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";
import { setSession } from "../../utils/auth";
import { ApiError } from "../../utils/api";
import { registerPartner, sendPartnerOtp } from "./partnerApi";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

function PartnerVerify() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pending, setPending] = useState(null);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  // Demo mode: when the backend has DEV_LOG_OTP enabled, /send-otp hands
  // the code straight back instead of emailing it, so it can be shown and
  // auto-filled here rather than requiring a real inbox during a demo.
  const [demoOtp, setDemoOtp] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("rm_pending_partner");
    const parsed = stored ? JSON.parse(stored) : null;

    if (!parsed || !parsed.email) {
      navigate("/partner/register", { replace: true });
      return;
    }

    setPending(parsed);

    if (parsed.devOtp) {
      setDemoOtp(parsed.devOtp);
      setDigits(String(parsed.devOtp).split("").slice(0, OTP_LENGTH));
    }
  }, [navigate, location.state]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const email = pending?.email || "";

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (serverError) setServerError("");

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => text[i] || ""));
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (countdown > 0 || !email) return;
    setIsResending(true);
    setServerError("");

    try {
      const response = await sendPartnerOtp(email);
      setCountdown(RESEND_SECONDS);

      if (response?.devOtp) {
        setDemoOtp(response.devOtp);
        setDigits(String(response.devOtp).split("").slice(0, OTP_LENGTH));
      } else {
        setDemoOtp(null);
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Could not resend the code.");
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = digits.join("");

    if (otp.length !== OTP_LENGTH) {
      setServerError("Please enter the 6 digit code");
      return;
    }

    if (!pending) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const data = await registerPartner({ ...pending, otp });

      sessionStorage.removeItem("rm_pending_partner");
      setSession(data.token, data.data);

      navigate("/partner/dashboard", { replace: true });
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pending) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50/60 to-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="mb-4">
            <img src={logo} alt="RepairMithra" className="h-20 w-auto object-contain" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          <button
            onClick={() => navigate("/partner/register")}
            className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <FiArrowLeft size={16} />
            Back
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FiMail size={28} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Verify Your Account</h1>
            <p className="mt-1 text-sm text-slate-500">
              We have sent a 6-digit OTP to
              <br />
              <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>

          {demoOtp && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <FiInfo className="mt-0.5 shrink-0" size={16} />
              <span>
                Demo mode: no email is actually sent. Your verification code is{" "}
                <span className="font-bold tracking-widest">{demoOtp}</span> (already
                filled in below).
              </span>
            </div>
          )}

          {serverError && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="mt-6">
            <div className="mb-6 flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-14 w-11 rounded-xl border border-gray-300 text-center text-xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {countdown > 0 ? (
              `Resend OTP in 00:${String(countdown).padStart(2, "0")}`
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
              >
                {isResending ? "Resending..." : "Resend Code"}
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PartnerVerify;
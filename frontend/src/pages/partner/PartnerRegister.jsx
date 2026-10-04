import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiMapPin,
  FiBriefcase,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";
import { geocodeAddress } from "../../utils/geocode";
import { sendPartnerOtp, getServices } from "./partnerApi";
import { ApiError } from "../../utils/api";

const EXPERIENCE_OPTIONS = [0, 1, 2, 3, 5, 7, 10, 15];

function PartnerRegister() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    experienceYears: "1",
    city: "",
    address: "",
    pincode: "",
    agreeTerms: false,
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getServices(controller.signal)
      .then((data) => setServices(data.services || []))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setServicesError("Could not load service categories. Please refresh the page.");
      });

    return () => controller.abort();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (serverError) setServerError("");
  };

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    if (errors.services) setErrors((prev) => ({ ...prev, services: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name";
    }

    if (!/^[6-9][0-9]{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10 digit Indian mobile number";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (selectedServiceIds.length === 0) {
      newErrors.services = "Select at least one service category";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Enter your city / service area";
    }

    if (formData.address.trim().length < 5) {
      newErrors.address = "Enter your full address";
    }

    if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6 digit pincode";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must accept the Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Turn the typed address into map coordinates, same as the customer
      // booking flow, so this partner can be matched to nearby jobs.
      let coords;
      try {
        coords = await geocodeAddress({
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
        });
      } catch {
        throw new Error(
          "We couldn't locate that address on the map. Please check your address, city and pincode."
        );
      }

      const email = formData.email.trim().toLowerCase();

      const otpResponse = await sendPartnerOtp(email);

      const pendingPartner = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        experienceYears: Number(formData.experienceYears) || 0,
        city: formData.city.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        serviceIds: selectedServiceIds,
        latitude: coords.latitude,
        longitude: coords.longitude,
        // Only present when the backend is running in demo mode
        // (DEV_LOG_OTP=true), so the verify screen can show/auto-fill it.
        devOtp: otpResponse?.devOtp || null,
      };

      sessionStorage.setItem("rm_pending_partner", JSON.stringify(pendingPartner));

      navigate("/partner/verify", { state: { email: pendingPartner.email } });
    } catch (err) {
      setServerError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="mb-4">
            <img src={logo} alt="RepairMithra" className="h-20 w-auto object-contain" />
          </Link>
          <div className="mb-2 flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            <FiBriefcase size={16} />
            Partner Registration
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join and grow your business</h1>
          <p className="mt-1 text-sm text-slate-500">
            Fill your details and register as a RepairMithra partner
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8"
        >
          {serverError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Full Name */}
          <Field label="Full Name" error={errors.fullName}>
            <IconInput icon={FiUser}>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                className={inputClass(errors.fullName)}
              />
            </IconInput>
          </Field>

          {/* Mobile */}
          <Field label="Mobile Number" error={errors.phone}>
            <IconInput icon={FiPhone}>
              <input
                name="phone"
                inputMode="numeric"
                maxLength={10}
                value={formData.phone}
                onChange={(e) =>
                  handleChange({
                    target: { name: "phone", value: e.target.value.replace(/\D/g, "") },
                  })
                }
                placeholder="10 digit mobile number"
                className={inputClass(errors.phone)}
              />
            </IconInput>
          </Field>

          {/* Email */}
          <Field label="Email Address" error={errors.email}>
            <IconInput icon={FiMail}>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={inputClass(errors.email)}
              />
            </IconInput>
          </Field>

          {/* Password */}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Password" error={errors.password}>
              <IconInput icon={FiLock}>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputClass(errors.password, true)}
                />
                <PasswordToggle show={showPassword} setShow={setShowPassword} />
              </IconInput>
            </Field>

            <Field label="Confirm Password" error={errors.confirmPassword}>
              <IconInput icon={FiLock}>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputClass(errors.confirmPassword, true)}
                />
                <PasswordToggle show={showConfirmPassword} setShow={setShowConfirmPassword} />
              </IconInput>
            </Field>
          </div>

          {/* Service Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Select Service Category
            </label>
            {servicesError && <p className="mb-2 text-xs text-red-600">{servicesError}</p>}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {services.map((service) => {
                const active = selectedServiceIds.includes(service._id);
                return (
                  <button
                    type="button"
                    key={service._id}
                    onClick={() => toggleService(service._id)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                      active
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 text-slate-600 hover:border-emerald-300"
                    }`}
                  >
                    {service.name}
                  </button>
                );
              })}
            </div>
            {errors.services && <p className="mt-1.5 text-xs text-red-600">{errors.services}</p>}
          </div>

          {/* Experience */}
          <Field label="Experience (Years)">
            <select
              name="experienceYears"
              value={formData.experienceYears}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {EXPERIENCE_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y === 0 ? "Less than 1 year" : `${y}+ years`}
                </option>
              ))}
            </select>
          </Field>

          {/* City / Service Area */}
          <Field label="Your City / Service Area" error={errors.city}>
            <IconInput icon={FiMapPin}>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Jangaon, Telangana"
                className={inputClass(errors.city)}
              />
            </IconInput>
          </Field>

          {/* Address */}
          <Field label="Address" error={errors.address}>
            <IconInput icon={FiMapPin}>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House / street / area"
                className={inputClass(errors.address)}
              />
            </IconInput>
          </Field>

          {/* Pincode */}
          <Field label="Pincode" error={errors.pincode}>
            <input
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              value={formData.pincode}
              onChange={(e) =>
                handleChange({
                  target: { name: "pincode", value: e.target.value.replace(/\D/g, "") },
                })
              }
              placeholder="6 digit pincode"
              className={`w-full rounded-xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                errors.pincode
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-200"
              }`}
            />
          </Field>

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>I agree to the Terms &amp; Conditions and Partner Policy</span>
          </label>
          {errors.agreeTerms && <p className="text-xs text-red-600">{errors.agreeTerms}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Sending code...
              </>
            ) : (
              <>
                <FiCheckCircle size={18} />
                Register as Partner
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/partner/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---- small shared bits -----------------------------------------------------

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function IconInput({ icon: Icon, children }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
      {children}
    </div>
  );
}

function PasswordToggle({ show, setShow }) {
  return (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      tabIndex={-1}
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
    </button>
  );
}

const inputClass = (error, withRightIcon = false) =>
  `w-full rounded-xl border py-3 pl-10 ${withRightIcon ? "pr-11" : "pr-4"} text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
    error
      ? "border-red-400 focus:ring-red-200"
      : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-200"
  }`;

export default PartnerRegister;
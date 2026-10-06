import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiTool,
  FiMapPin,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiStar,
  FiSettings,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiLogOut,
  FiLock,
  FiMail,
  FiPhone,
} from "react-icons/fi";

import { clearSession, getStoredUser, getToken, setSession } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import PartnerHeader from "./components/PartnerHeader";
import {
  WorkingHoursPanel,
  BankPanel,
  DocumentsPanel,
  getHoursStatus,
  getBankStatus,
  getDocumentsStatus,
} from "./components/ProfileSections";
import { getPartnerProfile, updatePartnerProfile, getServices } from "./partnerApi";

// Services arrive either populated ({ _id, name }) or as bare ids, depending on
// which endpoint returned them — accept both.
const idsOf = (list) =>
  (list || []).map((x) => (typeof x === "string" ? x : x?._id)).filter(Boolean);

function PartnerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const successTimer = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    experienceYears: "",
    bio: "",
    serviceIds: [],
    isAvailable: true,
  });

  const load = useCallback(
    async (signal) => {
      try {
        const [profileRes, servicesRes] = await Promise.all([
          getPartnerProfile(signal),
          getServices(signal),
        ]);

        setProfile(profileRes.data);
        setServices(servicesRes.services || []);
        setForm({
          fullName: profileRes.data.user.fullName || "",
          phone: profileRes.data.user.phone || "",
          city: profileRes.data.technician.city || "",
          experienceYears: String(profileRes.data.technician.experienceYears ?? 0),
          bio: profileRes.data.technician.bio || "",
          serviceIds: idsOf(profileRes.data.technician.services),
          isAvailable: profileRes.data.technician.isAvailable,
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true, state: { from: "/partner/profile" } });
          return;
        }
        setError(err.message || "Failed to load profile");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!getToken()) {
      navigate("/partner/login", { replace: true, state: { from: "/partner/profile" } });
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, navigate]);

  const toggleService = (id) => {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter((s) => s !== id)
        : [...prev.serviceIds, id],
    }));
  };

  // Show a message at the top of the page and scroll there, so the result of a
  // "Save Changes" button at the bottom of a long list is never out of sight.
  const showMessage = (type, text) => {
    clearTimeout(successTimer.current);
    setError(type === "error" ? text : "");
    setSuccess(type === "success" ? text : "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (type === "success") {
      successTimer.current = setTimeout(() => setSuccess(""), 4000);
    }
  };

  useEffect(() => () => clearTimeout(successTimer.current), []);

  const validate = (section) => {
    if (section === "personal") {
      if (form.fullName.trim().length < 2) return "Please enter your full name.";
      if (!/^[6-9]\d{9}$/.test(form.phone)) {
        return "Enter a valid 10-digit mobile number.";
      }
    }
    if (section === "services" && form.serviceIds.length === 0) {
      return "Select at least one service category.";
    }
    if (section === "area" && form.city.trim().length < 2) {
      return "Please enter your service area.";
    }
    return "";
  };

  const saveProfile = async (payload) => {
    const res = await updatePartnerProfile({
      ...payload,
      fullName: payload.fullName.trim(),
      city: payload.city.trim(),
      bio: payload.bio.trim(),
      experienceYears: Number(payload.experienceYears) || 0,
    });

    setProfile((prev) => ({ ...prev, user: res.data.user, technician: res.data.technician }));

    // Keep the saved session (used by the header/menu) in step with the new name/phone.
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored && res.data?.user) {
      setSession(token, {
        ...stored,
        fullName: res.data.user.fullName ?? stored.fullName,
        phone: res.data.user.phone ?? stored.phone,
      });
    }
    return res;
  };

  const handleSave = async (section) => {
    const problem = validate(section);
    if (problem) {
      showMessage("error", problem);
      return;
    }

    setSaving(true);
    try {
      await saveProfile(form);
      showMessage("success", "Profile updated successfully");
      setExpanded(null);
    } catch (err) {
      if (isAuthError(err)) {
        navigate("/partner/login", { replace: true, state: { from: "/partner/profile" } });
        return;
      }
      showMessage("error", err.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  // The availability checkbox saves straight away (it used to change only on
  // screen until some other section happened to be saved).
  const handleAvailabilityChange = async (checked) => {
    const previous = form.isAvailable;
    setForm((p) => ({ ...p, isAvailable: checked }));
    setSavingAvailability(true);
    try {
      // Only send saved values + the toggle, so half-edited fields aren't saved by accident.
      await saveProfile({
        fullName: profile.user.fullName || "",
        phone: profile.user.phone || "",
        city: profile.technician.city || "",
        experienceYears: profile.technician.experienceYears ?? 0,
        bio: profile.technician.bio || "",
        serviceIds: idsOf(profile.technician.services),
        isAvailable: checked,
      });
      showMessage("success", checked ? "You're now available for new jobs" : "You're now marked unavailable");
    } catch (err) {
      setForm((p) => ({ ...p, isAvailable: previous }));
      showMessage("error", err.message || "Could not update availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  const [savingExtra, setSavingExtra] = useState(false);

  // Working hours, bank details and documents are saved through the same
  // profile endpoint. The saved profile values are re-sent alongside, so
  // half-edited fields in other sections are never saved by accident.
  const saveExtra = async (field, value, message) => {
    setSavingExtra(true);
    try {
      const t = profile.technician;
      const res = await saveProfile({
        fullName: profile.user.fullName || "",
        phone: profile.user.phone || "",
        city: t.city || "",
        experienceYears: t.experienceYears ?? 0,
        bio: t.bio || "",
        serviceIds: idsOf(t.services),
        isAvailable: t.isAvailable,
        [field]: value,
      });
      if (res.data?.technician?.[field] === undefined) {
        throw new Error(
          `The server accepted the request but did not store "${field}". The backend profile route needs to save this field.`
        );
      }
      showMessage("success", message);
      if (field !== "documents") setExpanded(null);
    } catch (err) {
      if (isAuthError(err)) {
        navigate("/partner/login", { replace: true, state: { from: "/partner/profile" } });
        return;
      }
      showMessage("error", err.message || "Could not save changes");
    } finally {
      setSavingExtra(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/partner/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const experienceOptions = [0, 1, 2, 3, 5, 7, 10, 15];
  const currentYears = Number(form.experienceYears);
  if (!Number.isNaN(currentYears) && !experienceOptions.includes(currentYears)) {
    experienceOptions.push(currentYears);
    experienceOptions.sort((a, b) => a - b);
  }

  const initial = (profile?.user?.fullName || "P").trim().charAt(0).toUpperCase();

  const MENU_ITEMS = [
    { key: "personal", label: "Personal Details", icon: FiUser },
    { key: "services", label: "Service Categories", icon: FiTool },
    { key: "area", label: "Service Area", icon: FiMapPin },
    { key: "hours", label: "Working Hours", icon: FiClock, status: getHoursStatus(profile?.technician?.workingHours) },
    { key: "bank", label: "Bank & Payment Details", icon: FiCreditCard, status: getBankStatus(profile?.technician?.bankDetails) },
    { key: "documents", label: "Documents", icon: FiFileText, status: getDocumentsStatus(profile?.technician?.documents) },
    { key: "ratings", label: "Ratings & Reviews", icon: FiStar },
    { key: "settings", label: "Account Settings", icon: FiSettings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <PartnerHeader title="My Profile" />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <FiCheckCircle className="mt-0.5 shrink-0" size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Header card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
            {initial}
          </div>
          <h1 className="text-lg font-bold text-slate-900">{profile?.user?.fullName}</h1>
          <p className="text-sm text-slate-500">
            {services
              .filter((s) => form.serviceIds.includes(s._id))
              .map((s) => s.name)
              .join(" & ") || "Technician"}
          </p>

          {profile?.avgRating != null && (
            <p className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-amber-500">
              <FiStar className="fill-amber-400" size={16} />
              {profile.avgRating} ({profile.technician.ratingCount} ratings)
            </p>
          )}

          <label className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={form.isAvailable}
              disabled={savingAvailability}
              onChange={(e) => handleAvailabilityChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Available for new jobs
          </label>
        </div>

        {/* Menu */}
        <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
          {MENU_ITEMS.map(({ key, label, icon: Icon, status }) => (
            <div key={key}>
              <button
                aria-expanded={expanded === key}
                onClick={() => {
                  setExpanded((prev) => (prev === key ? null : key));
                }}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <Icon size={17} className="text-emerald-600" />
                  {label}
                  {status && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        status.tone === "green"
                          ? "bg-emerald-50 text-emerald-700"
                          : status.tone === "amber"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {status.label}
                    </span>
                  )}
                </span>
                {(
                  <FiChevronRight
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      expanded === key ? "rotate-90" : ""
                    }`}
                  />
                )}
              </button>

              {expanded === "personal" && key === "personal" && (
                <div className="space-y-3 px-5 pb-5">
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    placeholder="Mobile number"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Short bio (optional)"
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    onClick={() => handleSave("personal")}
                    disabled={saving}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {expanded === "services" && key === "services" && (
                <div className="px-5 pb-5">
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {services.map((service) => {
                      const active = form.serviceIds.includes(service._id);
                      return (
                        <button
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
                  <button
                    onClick={() => handleSave("services")}
                    disabled={saving}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {expanded === "area" && key === "area" && (
                <div className="space-y-3 px-5 pb-5">
                  <input
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City / service area"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <select
                    value={form.experienceYears}
                    onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {experienceOptions.map((y) => (
                      <option key={y} value={y}>
                        {y === 0 ? "Less than 1 year" : `${y}+ years experience`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleSave("area")}
                    disabled={saving}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {expanded === "hours" && key === "hours" && (
                <WorkingHoursPanel
                  saved={profile?.technician?.workingHours}
                  saving={savingExtra}
                  onError={(m) => showMessage("error", m)}
                  onSave={(v) => saveExtra("workingHours", v, "Working hours updated")}
                />
              )}

              {expanded === "bank" && key === "bank" && (
                <BankPanel
                  saved={profile?.technician?.bankDetails}
                  saving={savingExtra}
                  onError={(m) => showMessage("error", m)}
                  onSave={(v) => saveExtra("bankDetails", v, "Bank details saved")}
                />
              )}

              {expanded === "documents" && key === "documents" && (
                <DocumentsPanel
                  saved={profile?.technician?.documents}
                  saving={savingExtra}
                  onError={(m) => showMessage("error", m)}
                  onSave={(v) => saveExtra("documents", v, "Documents updated")}
                />
              )}

              {expanded === "settings" && key === "settings" && (
                <div className="space-y-3 px-5 pb-5 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <FiMail size={15} className="text-emerald-600" />
                    {profile?.user?.email || "No email on file"}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiPhone size={15} className="text-emerald-600" />
                    {profile?.user?.phone || "No mobile number on file"}
                  </p>
                  <button
                    onClick={() => navigate("/partner/forgot-password")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <FiLock size={15} />
                    Change Password
                  </button>
                </div>
              )}

              {expanded === "ratings" && key === "ratings" && (
                <div className="px-5 pb-5 text-sm text-slate-600">
                  {profile?.avgRating != null ? (
                    <p>
                      You have an average rating of{" "}
                      <span className="font-semibold text-slate-900">{profile.avgRating} / 5</span>{" "}
                      from {profile.technician.ratingCount} completed jobs.
                    </p>
                  ) : (
                    <p>No ratings yet — complete a few jobs to start building your rating.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-semibold text-red-600 transition hover:bg-red-50"
        >
          <FiLogOut size={18} />
          Log Out
        </button>
      </main>
    </div>
  );
}

export default PartnerProfile;
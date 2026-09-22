import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LuArrowRight,
  LuCalendar,
  LuClock,
  LuLoader,
  LuLocateFixed,
  LuMapPin,
  LuTriangleAlert,
} from "react-icons/lu";

import Breadcrumbs from "../../components/booking/Breadcrumbs";
import BookingStepper from "../../components/booking/Bookingstepper";
import ServiceNotFound from "../../components/booking/ServiceNotFound";
import { ServicesError, ServicesLoading } from "../../components/booking/ServicesStatus";
import { LOCATIONS } from "../../components/navbar/LocationSelector";
import { useServices } from "../../hooks/useServices";
import { isAuthError } from "../../utils/api";
import { getStoredUser, useAuth } from "../../utils/auth";
import { loadDraft, saveDraft } from "../../utils/bookingStorage";
import { addDays, formatINR, toISODate } from "../../utils/format";
import { geocodeAddress, lookupCurrentLocation } from "../../utils/geocode";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

// "Warangal, Telangana" → "Warangal" (unique, alphabetical)
const CITY_OPTIONS = [
  ...new Set(LOCATIONS.map((place) => place.split(",")[0].trim())),
].sort((a, b) => a.localeCompare(b));

const TIME_SLOTS = [
  { label: "06:00 AM - 10:00 AM", startHour: 6 },
  { label: "10:00 AM - 02:00 PM", startHour: 10 },
  { label: "02:00 PM - 06:00 PM", startHour: 14 },
  { label: "06:00 PM - 10:00 PM", startHour: 18 },
];

// A slot is bookable for today only if it starts at least an hour from now.
const slotsForDate = (isoDate) => {
  const now = new Date();
  if (isoDate !== toISODate(now)) return TIME_SLOTS;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return TIME_SLOTS.filter((slot) => slot.startHour * 60 >= nowMinutes + 60);
};

// Coordinates are only valid for the city + pincode they were found for.
const coordsKeyFor = (city, pincode) => `${city}|${pincode}`;

// Unchanged details → keep the booking already created for this draft, so
// going back and forward does not create duplicate bookings.
const SAME_BOOKING_FIELDS = ["address", "city", "pincode", "date", "time", "notes"];

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
  }`;

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function BookServiceForm({ service }) {
  const navigate = useNavigate();
  const Icon = service.icon;

  const today = new Date();
  const tomorrow = toISODate(addDays(today, 1));
  // If today has no slots left (late evening), the earliest bookable day is tomorrow.
  const minDate = slotsForDate(toISODate(today)).length > 0 ? toISODate(today) : tomorrow;

  const [form, setForm] = useState(() => {
    const draft = loadDraft(service.slug);
    const user = getStoredUser();

    return {
      address: draft?.address ?? user?.address ?? "",
      city: draft?.city ?? "Hyderabad",
      pincode: draft?.pincode ?? user?.pincode ?? "",
      date: draft?.date ?? tomorrow,
      time: draft?.time ?? TIME_SLOTS[1].label,
      notes: draft?.notes ?? "",

      // Map position of the address (filled by GPS or looked up on submit)
      latitude: draft?.latitude ?? null,
      longitude: draft?.longitude ?? null,
      coordsKey: draft?.coordsKey ?? "",
    };
  });
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState(null); // { type, text }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const availableSlots = slotsForDate(form.date);
  const cityOptions =
    !form.city || CITY_OPTIONS.includes(form.city)
      ? CITY_OPTIONS
      : [form.city, ...CITY_OPTIONS];

  const update = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateChange = (value) => {
    const slots = slotsForDate(value);
    setForm((prev) => ({
      ...prev,
      date: value,
      // Keep the chosen time if it is still available on the new date
      time: slots.some((s) => s.label === prev.time) ? prev.time : slots[0]?.label ?? "",
    }));
    if (errors.date || errors.time) setErrors((prev) => ({ ...prev, date: "", time: "" }));
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setLocationMessage(null);

    try {
      const found = await lookupCurrentLocation();

      setForm((prev) => {
        const city = found.city || prev.city;
        const pincode = found.pincode || prev.pincode;

        return {
          ...prev,
          address: found.address || prev.address,
          city,
          pincode,
          latitude: found.latitude,
          longitude: found.longitude,
          coordsKey: coordsKeyFor(city, pincode),
        };
      });
      setErrors((prev) => ({ ...prev, address: "", city: "", pincode: "" }));
      setLocationMessage({
        type: "success",
        text: "Location filled in. Please add your house number and landmark.",
      });
    } catch (err) {
      const denied = err && err.code === 1;
      setLocationMessage({
        type: "error",
        text: denied
          ? "Location access was blocked. Allow it in your browser, or type your address below."
          : "We couldn't detect your location. Please type your address below.",
      });
    } finally {
      setLocating(false);
    }
  };

  const validate = () => {
    const next = {};

    if (form.address.trim().length < 5) {
      next.address = "Enter your full address (house no, building, street, area)";
    }
    if (!form.city) next.city = "Select your city";
    if (!/^[0-9]{6}$/.test(form.pincode)) next.pincode = "Enter a valid 6-digit pincode";
    if (!form.date) next.date = "Choose a date";
    else if (form.date < minDate) next.date = "Choose today or a later date";
    if (!form.time || !availableSlots.some((s) => s.label === form.time)) {
      next.time = "Choose an available time slot";
    }

    setErrors(next);

    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();

    return !firstInvalid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setSubmitError("");

    const details = {
      serviceSlug: service.slug,
      address: form.address.trim(),
      city: form.city,
      pincode: form.pincode,
      date: form.date,
      time: form.time,
      notes: form.notes.trim(),
    };

    // Keep what the customer typed, even if something below fails
    saveDraft({
      ...details,
      latitude: form.latitude,
      longitude: form.longitude,
      coordsKey: form.coordsKey,
    });

    try {
      // 1. Where is the address on the map? (the booking is saved with its location)
      let { latitude, longitude } = form;
      const coordsKey = coordsKeyFor(form.city, form.pincode);

      if (latitude === null || longitude === null || form.coordsKey !== coordsKey) {
        ({ latitude, longitude } = await geocodeAddress(details));
      }

      // 2. Save the draft for the payment page
      const previous = loadDraft(service.slug);
      const unchanged =
        previous?.bookingId &&
        SAME_BOOKING_FIELDS.every((field) => previous[field] === details[field]);

      saveDraft({
        ...details,
        latitude,
        longitude,
        coordsKey,
        ...(unchanged
          ? { bookingId: previous.bookingId, bookingCode: previous.bookingCode }
          : {}),
      });

      navigate(`/services/${service.slug}/payment`);
    } catch (err) {
      // Session expired → the page wrapper sends the user to log in
      if (isAuthError(err)) return;

      if (err.message === "not-found") {
        setSubmitError(
          "We couldn't find this address on the map. Please check the city and pincode, or tap “Use current location”."
        );
      } else if (err.message === "lookup-failed" || err.name === "TimeoutError") {
        setSubmitError(
          "We couldn't check your location right now. Please try again in a moment."
        );
      } else {
        setSubmitError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const describedBy = (name) => (errors[name] ? `${name}-error` : undefined);

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Services", to: "/services" },
            { label: service.title, to: `/services/${service.slug}` },
            { label: "Book Service" },
          ]}
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <BookingStepper current={1} />

          {/* Service selected */}
          <section className="mt-8" aria-labelledby="selected-heading">
            <h2 id="selected-heading" className="text-sm font-bold text-slate-900">
              Service Selected
            </h2>

            <div className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 p-3">
              <span
                className={`flex h-14 w-20 shrink-0 items-center justify-center rounded-xl ${service.tone}`}
              >
                <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900">{service.title}</p>
                <p className="text-sm text-slate-600">
                  Visit Fee: {formatINR(service.visitFee)}
                </p>
              </div>

              <Link
                to="/services"
                className="shrink-0 pr-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Change
              </Link>
            </div>
          </section>

          {/* Address */}
          <section className="mt-8" aria-labelledby="address-heading">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="address-heading"
                className="flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <LuMapPin className="text-blue-600" size={17} aria-hidden="true" />
                Service Address
              </h2>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                {locating ? (
                  <LuLoader size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <LuLocateFixed size={15} aria-hidden="true" />
                )}
                {locating ? "Locating..." : "Use current location"}
              </button>
            </div>

            {locationMessage && (
              <p
                role="status"
                className={`mt-2 text-xs ${
                  locationMessage.type === "error" ? "text-red-600" : "text-green-700"
                }`}
              >
                {locationMessage.text}
              </p>
            )}

            <div className="mt-4 space-y-4">
              <Field id="address" label="Full Address" required error={errors.address}>
                <input
                  id="address"
                  type="text"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="House No, Building, Street, Area"
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={describedBy("address")}
                  className={inputClass(errors.address)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="city" label="City" required error={errors.city}>
                  <select
                    id="city"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={describedBy("city")}
                    className={inputClass(errors.city)}
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="pincode" label="Pincode" required error={errors.pincode}>
                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))}
                    placeholder="500081"
                    aria-invalid={Boolean(errors.pincode)}
                    aria-describedby={describedBy("pincode")}
                    className={inputClass(errors.pincode)}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="mt-6" aria-label="Schedule">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="date" label="Preferred Date" error={errors.date}>
                <div className="relative">
                  <LuCalendar
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="date"
                    type="date"
                    min={minDate}
                    value={form.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={describedBy("date")}
                    className={`${inputClass(errors.date)} pl-10`}
                  />
                </div>
              </Field>

              <Field id="time" label="Preferred Time" error={errors.time}>
                <div className="relative">
                  <LuClock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <select
                    id="time"
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                    aria-invalid={Boolean(errors.time)}
                    aria-describedby={describedBy("time")}
                    className={`${inputClass(errors.time)} pl-10`}
                  >
                    {availableSlots.map((slot) => (
                      <option key={slot.label} value={slot.label}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            <div className="mt-4">
              <Field id="notes" label="Additional Notes (Optional)">
                <textarea
                  id="notes"
                  rows={3}
                  maxLength={300}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder={
                    service.issues.length >= 2
                      ? `E.g., ${service.issues[0]}, ${service.issues[1].toLowerCase()}, etc.`
                      : "Tell us what needs fixing"
                  }
                  className={`${inputClass(false)} resize-none`}
                />
              </Field>
            </div>
          </section>

          {submitError && (
            <p
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800"
            >
              <LuTriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-wait disabled:opacity-80"
          >
            {submitting ? (
              <>
                <LuLoader size={20} className="animate-spin" aria-hidden="true" />
                Checking your address...
              </>
            ) : (
              <>
                Continue to Payment
                <LuArrowRight size={20} aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function BookService() {
  const { slug } = useParams();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { isLoading, error, reload, getServiceBySlug } = useServices();

  // Booking needs an account — send guests to log in, then bring them back here
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) return <ServicesLoading />;
  if (error) return <ServicesError message={error} onRetry={reload} />;

  const service = getServiceBySlug(slug);

  if (!service) return <ServiceNotFound />;

  // key= makes the form start fresh if the user switches to another service
  return <BookServiceForm key={service.slug} service={service} />;
}

export default BookService;
import { useState } from "react";
import { FiX, FiNavigation, FiHome, FiBriefcase, FiTag, FiLoader } from "react-icons/fi";

import { apiFetch } from "../../../utils/api";

const LABEL_PRESETS = [
  { value: "Home", icon: FiHome },
  { value: "Work", icon: FiBriefcase },
  { value: "Other", icon: FiTag },
];

// Turns a Nominatim /reverse response into a single-line street address.
const buildAddressLine = (addr = {}) => {
  const parts = [
    addr.house_number,
    addr.road || addr.pedestrian || addr.neighbourhood,
    addr.suburb,
    addr.city || addr.town || addr.village || addr.county,
    addr.state,
  ].filter(Boolean);

  return parts.join(", ");
};

function AddAddressModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ label: "Home", address: "", pincode: "" });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [coords, setCoords] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location detection.");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } }
          );

          if (!res.ok) throw new Error("Lookup failed");

          const data = await res.json();
          const line = buildAddressLine(data.address) || data.display_name || "";
          const postcode = data.address?.postcode || "";

          setForm((prev) => ({
            ...prev,
            address: line || prev.address,
            pincode: /^[0-9]{6}$/.test(postcode) ? postcode : prev.pincode,
          }));
        } catch {
          setLocationError(
            "Found your location, but couldn't look up the address. Please fill it in manually."
          );
        } finally {
          setLocating(false);
        }
      },
      (geoError) => {
        setLocating(false);
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location access was denied. Please allow it or enter the address manually."
            : "Couldn't detect your location. Please enter the address manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const data = await apiFetch("/api/auth/addresses", {
        method: "POST",
        auth: true,
        body: {
          label: form.label,
          address: form.address,
          pincode: form.pincode,
          ...(coords || {}),
        },
      });

      onSaved(data.data);
    } catch (err) {
      setError(err.message || "Could not save this address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add Address</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Auto-detect location */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
        >
          {locating ? (
            <>
              <FiLoader size={16} className="animate-spin" /> Detecting your location...
            </>
          ) : (
            <>
              <FiNavigation size={16} /> Use my current location
            </>
          )}
        </button>
        {locationError && (
          <p className="mt-2 text-xs text-amber-600">{locationError}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Label
            </label>
            <div className="flex gap-2">
              {LABEL_PRESETS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, label: value === "Other" ? "" : value }))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    (value === "Other" ? !LABEL_PRESETS.some((p) => p.value === form.label) : form.label === value)
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={14} /> {value}
                </button>
              ))}
            </div>
            {!LABEL_PRESETS.some((p) => p.value === form.label) && (
              <input
                type="text"
                value={form.label}
                placeholder="e.g. Mom's place"
                onChange={handleChange("label")}
                required
                maxLength={30}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-sky-500"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={handleChange("address")}
              required
              minLength={5}
              maxLength={250}
              rows={3}
              placeholder="House / flat no., street, area"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Pincode
            </label>
            <input
              type="text"
              value={form.pincode}
              onChange={handleChange("pincode")}
              required
              pattern="[0-9]{6}"
              title="Enter a valid 6 digit pincode"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-sky-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-sky-600 py-2.5 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAddressModal;
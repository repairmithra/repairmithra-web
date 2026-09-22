import { useState } from "react";
import { FiX } from "react-icons/fi";

import { apiFetch } from "../../../utils/api";

function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    phone: user.phone || "",
    address: user.address || "",
    pincode: user.pincode || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const data = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        auth: true,
        body: form,
      });

      onSaved(data.data);
    } catch (err) {
      setError(err.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={handleChange("fullName")}
              required
              minLength={2}
              maxLength={60}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              required
              pattern="[6-9][0-9]{9}"
              title="Enter a valid 10 digit Indian mobile number"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500"
            />
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
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500"
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
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-blue-500"
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
              className="flex-1 rounded-xl bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
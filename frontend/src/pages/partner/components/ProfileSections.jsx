import { useEffect, useState } from "react";
import { FiUpload, FiTrash2, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";

const inputCls =
  "w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";
const saveCls =
  "w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60";

/* ------------------------------------------------------------------ */
/* Working hours                                                       */
/* ------------------------------------------------------------------ */

export const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export const defaultHours = () =>
  Object.fromEntries(
    DAYS.map(({ key }) => [key, { open: key !== "sun", start: "09:00", end: "18:00" }])
  );

const toMinutes = (t) => {
  const [h, m] = String(t || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
};

// "Open now" / "Closed now" / "Off today" / "Not set" — shown next to the menu item.
export function getHoursStatus(hours, now = new Date()) {
  if (!hours) return { label: "Not set", tone: "gray" };
  const key = DAYS[(now.getDay() + 6) % 7].key; // JS: Sunday = 0
  const today = hours[key];
  if (!today?.open) return { label: "Off today", tone: "gray" };
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= toMinutes(today.start) && mins < toMinutes(today.end)
    ? { label: "Open now", tone: "green" }
    : { label: "Closed now", tone: "amber" };
}

export function WorkingHoursPanel({ saved, saving, onSave, onError }) {
  const [hours, setHours] = useState(() => ({ ...defaultHours(), ...(saved || {}) }));

  useEffect(() => setHours({ ...defaultHours(), ...(saved || {}) }), [saved]);

  const update = (key, patch) =>
    setHours((h) => ({ ...h, [key]: { ...h[key], ...patch } }));

  const submit = () => {
    if (!DAYS.some(({ key }) => hours[key].open)) {
      return onError("Select at least one working day.");
    }
    const bad = DAYS.find(
      ({ key }) => hours[key].open && toMinutes(hours[key].end) <= toMinutes(hours[key].start)
    );
    if (bad) return onError(`${bad.label}: closing time must be after opening time.`);
    onSave(hours);
  };

  return (
    <div className="space-y-2 px-5 pb-5">
      {DAYS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-2 text-sm">
          <label className="flex w-28 shrink-0 items-center gap-2 font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hours[key].open}
              onChange={(e) => update(key, { open: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            {label.slice(0, 3)}
          </label>
          {hours[key].open ? (
            <>
              <input
                type="time"
                value={hours[key].start}
                onChange={(e) => update(key, { start: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
              <span className="text-slate-400">to</span>
              <input
                type="time"
                value={hours[key].end}
                onChange={(e) => update(key, { end: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
              />
            </>
          ) : (
            <span className="text-slate-400">Day off</span>
          )}
        </div>
      ))}
      <button onClick={submit} disabled={saving} className={`${saveCls} mt-3`}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bank & payment details                                              */
/* ------------------------------------------------------------------ */

export const maskAccount = (n) => {
  const s = String(n || "").replace(/\s/g, "");
  return s.length > 4 ? `${"•".repeat(s.length - 4)}${s.slice(-4)}` : s;
};

export const getBankStatus = (bank) =>
  bank?.accountNumber || bank?.upiId
    ? { label: "Added", tone: "green" }
    : { label: "Not added", tone: "gray" };

export function BankPanel({ saved, saving, onSave, onError }) {
  const blank = { accountHolder: "", accountNumber: "", ifsc: "", bankName: "", upiId: "" };
  // The server only returns a masked account number, so the field starts empty
  // when one is already saved; leaving it empty keeps the saved number.
  const fresh = () => ({ ...blank, ...(saved || {}), accountNumber: "" });
  const [form, setForm] = useState(fresh);
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    setForm(fresh());
    setConfirm("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const hasSaved = Boolean(saved?.accountNumber);
    const keepSaved = hasSaved && !form.accountNumber;
    const acc = keepSaved ? saved.accountNumber : form.accountNumber.replace(/\s/g, "");
    const ifsc = form.ifsc.trim().toUpperCase();
    const upi = form.upiId.trim();
    if (!acc && !upi) return onError("Enter bank account details or a UPI ID.");
    if (acc && !keepSaved) {
      if (form.accountHolder.trim().length < 2) return onError("Enter the account holder name.");
      if (!/^\d{9,18}$/.test(acc)) return onError("Account number must be 9 to 18 digits.");
      if (acc !== confirm.replace(/\s/g, "")) return onError("Account numbers do not match.");
    }
    if (acc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return onError("Enter a valid IFSC code (e.g. SBIN0001234).");
    }
    if (upi && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi)) return onError("Enter a valid UPI ID (e.g. name@upi).");
    onSave({ ...form, accountNumber: acc, ifsc, upiId: upi, accountHolder: form.accountHolder.trim() });
  };

  return (
    <div className="space-y-3 px-5 pb-5">
      {saved?.accountNumber && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          Payouts go to account {saved.accountNumber}
          {saved.bankName ? ` · ${saved.bankName}` : ""}
        </p>
      )}
      <input className={inputCls} placeholder="Account holder name" value={form.accountHolder}
        onChange={(e) => set("accountHolder", e.target.value)} />
      <input className={inputCls} inputMode="numeric" placeholder={saved?.accountNumber ? `Saved: ${saved.accountNumber} (leave blank to keep)` : "Account number"} value={form.accountNumber}
        onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 18))} />
      {form.accountNumber && (
        <input className={inputCls} inputMode="numeric" placeholder="Re-enter account number" value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 18))} />
      )}
      <input className={inputCls} placeholder="IFSC code" value={form.ifsc}
        onChange={(e) => set("ifsc", e.target.value.toUpperCase().slice(0, 11))} />
      <input className={inputCls} placeholder="Bank name (optional)" value={form.bankName}
        onChange={(e) => set("bankName", e.target.value)} />
      <input className={inputCls} placeholder="UPI ID (optional)" value={form.upiId}
        onChange={(e) => set("upiId", e.target.value)} />
      <button onClick={submit} disabled={saving} className={saveCls}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export const DOC_TYPES = [
  { key: "idProof", label: "ID proof (Aadhaar / PAN / Voter ID)" },
  { key: "photo", label: "Passport-size photo" },
  { key: "certificate", label: "Skill certificate (optional)" },
];

export function getDocumentsStatus(docs) {
  const list = Array.isArray(docs) ? docs : [];
  if (list.length === 0) return { label: "Not uploaded", tone: "gray" };
  if (list.some((d) => d.type === "idProof" && d.status === "verified")) {
    return { label: "Verified", tone: "green" };
  }
  return { label: "Pending review", tone: "amber" };
}

const MAX_BYTES = 1_000_000;

// Shrinks photos before upload so they fit comfortably in a JSON request.
const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      if (!file.type.startsWith("image/")) return resolve(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error("That image could not be opened."));
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export function DocumentsPanel({ saved, saving, onSave, onError }) {
  const docs = Array.isArray(saved) ? saved : [];

  const upload = async (type, file) => {
    if (!file) return;
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType) return onError("Upload a photo (JPG/PNG) or a PDF.");
    if (!file.type.startsWith("image/") && file.size > MAX_BYTES) {
      return onError("PDF must be smaller than 1 MB.");
    }
    try {
      const data = await readFile(file);
      onSave([...docs.filter((d) => d.type !== type), { type, name: file.name, data, status: "pending" }]);
    } catch (err) {
      onError(err.message);
    }
  };

  const remove = (type) => onSave(docs.filter((d) => d.type !== type));

  return (
    <div className="space-y-3 px-5 pb-5">
      {DOC_TYPES.map(({ key, label }) => {
        const doc = docs.find((d) => d.type === key);
        return (
          <div key={key} className="rounded-xl border border-gray-200 p-3">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            {doc ? (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                  {doc.status === "verified" ? (
                    <FiCheckCircle className="shrink-0 text-emerald-600" />
                  ) : doc.status === "rejected" ? (
                    <FiAlertCircle className="shrink-0 text-red-500" />
                  ) : (
                    <FiClock className="shrink-0 text-amber-500" />
                  )}
                  <span className="truncate">{doc.name}</span>
                  <span className="shrink-0 font-semibold capitalize">· {doc.status || "pending"}</span>
                </span>
                <button onClick={() => remove(key)} disabled={saving} aria-label={`Remove ${label}`}
                  className="shrink-0 text-red-500 hover:text-red-600">
                  <FiTrash2 size={15} />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-400 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                <FiUpload size={15} />
                {saving ? "Uploading..." : "Upload"}
                <input type="file" accept="image/*,application/pdf" className="hidden" disabled={saving}
                  onChange={(e) => { upload(key, e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
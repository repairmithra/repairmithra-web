// ---------------------------------------------------------------------------
// Booking storage.
//
// There is no bookings API on the backend yet, so this file keeps bookings in
// the browser:
//   • the in-progress booking (“draft”)  → sessionStorage
//   • confirmed bookings                 → localStorage
//
// When you add a real bookings endpoint, replace the bodies of
// createBooking() / getBooking() below with fetch("/api/bookings…") calls —
// the pages only talk to these functions.
// ---------------------------------------------------------------------------

const DRAFT_KEY = "rm_booking_draft";
const BOOKINGS_KEY = "rm_bookings";

const read = (storage, key, fallback) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the flow still works for this session */
  }
};

// Logged-in user saved by Login.jsx (null for guests)
export const getStoredUser = () => read(localStorage, "rm_user", null);

// ---- Draft (address + schedule, before payment) ---------------------------

export const loadDraft = (slug) => {
  const draft = read(sessionStorage, DRAFT_KEY, null);
  return draft && draft.serviceSlug === slug ? draft : null;
};

export const saveDraft = (draft) => write(sessionStorage, DRAFT_KEY, draft);

export const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
};

// ---- Confirmed bookings ----------------------------------------------------

export const getBookings = () => read(localStorage, BOOKINGS_KEY, []);

export const getBooking = (id) => getBookings().find((b) => b.id === id) || null;

// ID format: RM-<visit date>-<3-digit number for that day>, e.g. RM-20260920-001
const nextBookingId = (visitDate, bookings) => {
  const prefix = `RM-${visitDate.replaceAll("-", "")}-`;
  const used = bookings.filter((b) => b.id.startsWith(prefix)).length;
  return `${prefix}${String(used + 1).padStart(3, "0")}`;
};

export function createBooking({ service, draft, payment }) {
  const bookings = getBookings();
  const user = getStoredUser();

  const booking = {
    id: nextBookingId(draft.date, bookings),
    status: "confirmed",
    createdAt: new Date().toISOString(),
    serviceSlug: service.slug,
    serviceTitle: service.title,
    visitFee: service.visitFee,
    address: draft.address,
    city: draft.city,
    pincode: draft.pincode,
    date: draft.date,
    time: draft.time,
    notes: draft.notes,
    payment: {
      method: payment.method,
      status: "paid",
      amount: service.visitFee,
      // Placeholder reference — a real gateway would return this.
      transactionId: `TXN${Date.now()}`,
    },
    customer: user
      ? { name: user.fullName, phone: user.phone, email: user.email }
      : null,
  };

  write(localStorage, BOOKINGS_KEY, [booking, ...bookings]);
  return booking;
}
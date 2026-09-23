// ======================================================
// Booking schedule helpers (shared by bookings + technicians)
// ======================================================
//
// A booking date is a CALENDAR DATE ("2026-09-20"), not a moment in time.
// We always store it as midnight UTC of that date so it never shifts by a
// day when the server runs in a different timezone (e.g. IST vs UTC).

export const BUSINESS_TIME_ZONE = "Asia/Kolkata";

// The four fixed visit slots. Keep in sync with the frontend
// (frontend/src/pages/services/BookService.jsx → TIME_SLOTS).
export const TIME_SLOTS = [
  "06:00 AM - 10:00 AM",
  "10:00 AM - 02:00 PM",
  "02:00 PM - 06:00 PM",
  "06:00 PM - 10:00 PM",
];

const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-09-20" (or "2026-09-20T10:00:00Z") → Date at 2026-09-20T00:00:00Z.
// Returns null for anything that is not a real calendar date.
export const parseBookingDate = (value) => {
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  // Rejects impossible dates such as 2026-02-31
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

// Today's calendar date in India, as midnight UTC.
export const todayInBusinessZone = () => {
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parseBookingDate(isoDate);
};

export const isPastBookingDate = (date) => date < todayInBusinessZone();

// [start, end) range covering the whole booking day
export const dayRange = (date) => ({
  start: date,
  end: new Date(date.getTime() + DAY_MS),
});

// Date → "20260920"
export const compactDate = (date) =>
  date.toISOString().slice(0, 10).replaceAll("-", "");
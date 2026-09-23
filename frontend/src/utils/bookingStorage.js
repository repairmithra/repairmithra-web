// ---------------------------------------------------------------------------
// Booking DRAFT storage.
//
// While the customer goes from the “Address & schedule” page to the “Payment”
// page, their choices are kept in sessionStorage (cleared when the tab is
// closed). Nothing here is a real booking — real bookings live on the server
// (POST /api/bookings → GET /api/bookings/:id).
//
// Draft shape:
//   { serviceSlug, address, city, pincode, latitude, longitude, coordsKey,
//     date, time, notes,
//     bookingId, bookingCode }   ← the last two are added once the booking has
//                                  been created on the server, so retrying a
//                                  failed payment does not create a duplicate
// ---------------------------------------------------------------------------

const DRAFT_KEY = "rm_booking_draft";

export const loadDraft = (slug) => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const draft = raw ? JSON.parse(raw) : null;
    return draft && draft.serviceSlug === slug ? draft : null;
  } catch {
    return null;
  }
};

export const saveDraft = (draft) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* storage full or blocked — the flow still works for this page view */
  }
};

export const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
};
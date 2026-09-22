import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../utils/api";

// API booking → the flat shape the booking pages use.
const toViewModel = (booking) => ({
  id: booking._id,

  // Friendly reference like RM-20260920-K7M2 (older bookings may not have one)
  code: booking.bookingCode || booking._id,

  status: booking.status,
  paymentStatus: booking.paymentStatus,

  serviceTitle: booking.service?.name ?? "Service",
  serviceSlug: booking.service?.slug ?? "",

  visitFee: booking.visitFee,

  address: booking.address,
  city: booking.city,
  pincode: booking.pincode,
  notes: booking.notes,

  // Stored as midnight UTC of the chosen calendar date → "2026-09-20"
  date: typeof booking.bookingDate === "string" ? booking.bookingDate.slice(0, 10) : "",
  time: booking.timeSlot,

  technician: booking.technician
    ? { name: booking.technician.fullName, phone: booking.technician.phone }
    : null,

  payment: booking.payment, // { amount, status, paidAt, transactionId } | null
});

// const { booking, status, error, reload } = useBooking(bookingId);
//   status: "loading" | "ready" | "notfound" | "error"
export function useBooking(bookingId) {
  const [state, setState] = useState({
    status: "loading",
    booking: null,
    error: null,
  });

  const load = useCallback(
    async (signal) => {
      try {
        const data = await apiFetch(
          `/api/bookings/${encodeURIComponent(bookingId)}`,
          { auth: true, signal }
        );

        setState({
          status: "ready",
          booking: toViewModel(data.booking),
          error: null,
        });
      } catch (error) {
        if (error?.name === "AbortError") return;

        setState({
          status: error.status === 404 ? "notfound" : "error",
          booking: null,
          error,
        });
      }
    },
    [bookingId]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, status: "loading" }));
    load();
  }, [load]);

  return { ...state, reload };
}
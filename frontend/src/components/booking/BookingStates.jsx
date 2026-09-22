import { Link } from "react-router-dom";
import { LuLoader, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

// Full-page states shared by the booking confirmation and status pages.

export function BookingLoading() {
  return (
    <section
      role="status"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <LuLoader className="animate-spin text-blue-600" size={32} aria-hidden="true" />
      <p className="mt-4 text-slate-600">Loading your booking...</p>
    </section>
  );
}

export function BookingNotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Booking not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        We couldn&apos;t find this booking in your account. Please check the link,
        or make sure you are logged in with the account you booked with.
      </p>
      <Link
        to="/services"
        className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
      >
        Book a service
      </Link>
    </section>
  );
}

export function BookingError({ message, onRetry }) {
  return (
    <section
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <LuTriangleAlert size={28} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        We couldn&apos;t load your booking
      </h1>
      <p className="mt-2 max-w-md text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        <LuRefreshCw size={18} aria-hidden="true" />
        Try again
      </button>
    </section>
  );
}
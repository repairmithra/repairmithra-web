import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { LuCheck } from "react-icons/lu";

import {
  BookingError,
  BookingLoading,
  BookingNotFound,
} from "../../components/booking/BookingStates";
import { SUPPORT } from "../../config/site";
import { useBooking } from "../../hooks/useBooking";
import { useAuth } from "../../utils/auth";
import { formatDate, formatINR } from "../../utils/format";

// Backend booking status → index of the step in TIMELINE that is currently in
// progress. Steps before it are shown as done. An index equal to
// TIMELINE.length means everything is done.
const STATUS_TO_STEP = {
  pending_payment: 0,
  confirmed: 1,
  technician_assigned: 2,
  technician_on_the_way: 2,
  technician_arrived: 2,
  inspection_completed: 3,
  repair_in_progress: 3,
  completed: 5,
};

const TIMELINE = [
  {
    title: "Booking confirmed",
    text: (b) =>
      b.paymentStatus === "paid"
        ? `Visit fee of ${formatINR(b.payment?.amount ?? b.visitFee)} paid.`
        : `Waiting for the visit fee of ${formatINR(b.visitFee)} to be paid.`,
  },
  {
    title: "Technician assigned",
    text: (b) =>
      b.technician
        ? `${b.technician.name} has been assigned to your booking.${
            b.technician.phone ? ` Contact: ${b.technician.phone}.` : ""
          }`
        : "We are notifying nearby technicians. You will get a call/notification once one accepts.",
  },
  {
    title: "Technician visit",
    text: (b) => {
      if (b.status === "technician_on_the_way") return "Your technician is on the way.";
      if (b.status === "technician_arrived") return "Your technician has arrived.";
      return `Scheduled for ${formatDate(b.date)}, ${b.time}.`;
    },
  },
  {
    title: "Diagnosis & repair",
    text: () => "After diagnosis, you pay the repair amount directly to the technician.",
  },
  {
    title: "Completed",
    text: () => "Rate your experience once the work is done.",
  },
];

function BookingStatusView({ bookingId }) {
  const { booking, status, error, reload } = useBooking(bookingId);

  if (status === "loading") return <BookingLoading />;
  if (status === "notfound") return <BookingNotFound />;
  if (status === "error") return <BookingError message={error?.message} onRetry={reload} />;

  const isCancelled = booking.status === "cancelled";

  // Index of the step currently in progress in TIMELINE
  const currentIndex = STATUS_TO_STEP[booking.status] ?? 1;

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-slate-500">Booking {booking.code}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Booking Status</h1>
        <p className="mt-1 text-slate-600">
          {booking.serviceTitle} on {formatDate(booking.date)}, {booking.time}
        </p>

        {isCancelled && (
          <p role="status" className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-800">
            This booking has been cancelled. Need help? Call {SUPPORT.phone}.
          </p>
        )}

        {!isCancelled && (
        <ol className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {TIMELINE.map((step, index) => {
            const done = index < currentIndex;
            const current = index === currentIndex;
            const last = index === TIMELINE.length - 1;

            return (
              <li
                key={step.title}
                aria-current={current ? "step" : undefined}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                {!last && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-4 top-8 h-[calc(100%-2rem)] w-0.5 -translate-x-1/2 ${
                      done ? "bg-green-600" : "bg-slate-200"
                    }`}
                  />
                )}

                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    done
                      ? "bg-green-600 text-white"
                      : current
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? <LuCheck size={16} strokeWidth={3} aria-hidden="true" /> : index + 1}
                </span>

                <div className="pt-0.5">
                  <p
                    className={`font-semibold ${
                      done || current ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                    {done && <span className="sr-only"> (completed)</span>}
                    {current && <span className="sr-only"> (in progress)</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{step.text(booking)}</p>
                </div>
              </li>
            );
          })}
        </ol>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/booking/${booking.id}/confirmation`}
            className="rounded-xl border-2 border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            View booking details
          </Link>
          <Link
            to="/services"
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Book another service
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookingStatus() {
  const { bookingId } = useParams();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <BookingStatusView key={bookingId} bookingId={bookingId} />;
}

export default BookingStatus;
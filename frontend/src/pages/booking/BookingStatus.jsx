import { Link, useParams } from "react-router-dom";
import { LuCheck } from "react-icons/lu";

import { getBooking } from "../../utils/bookingStorage";
import { formatDate, formatINR } from "../../utils/format";

// Stages a booking moves through. Until a bookings API exists, every new
// booking sits at “confirmed”, which shows step 2 (technician assignment) as current.
const STAGES = ["confirmed", "assigned", "visiting", "completed"];

const TIMELINE = [
  {
    title: "Booking confirmed",
    text: (b) => `Visit fee of ${formatINR(b.payment.amount)} paid.`,
  },
  {
    title: "Technician assigned",
    text: () => "We are notifying nearby technicians. You will get a call/notification once one accepts.",
  },
  {
    title: "Technician visit",
    text: (b) => `Scheduled for ${formatDate(b.date)}, ${b.time}.`,
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

function BookingStatus() {
  const { bookingId } = useParams();
  const booking = getBooking(bookingId);

  if (!booking) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Booking not found</h1>
        <p className="mt-3 max-w-md text-slate-600">
          We couldn't find a booking with ID {bookingId} on this device.
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

  // Index of the stage currently in progress in TIMELINE
  const currentIndex = Math.min(STAGES.indexOf(booking.status) + 1, TIMELINE.length - 1);

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-slate-500">Booking {booking.id}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Booking Status</h1>
        <p className="mt-1 text-slate-600">
          {booking.serviceTitle} on {formatDate(booking.date)}, {booking.time}
        </p>

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

export default BookingStatus;
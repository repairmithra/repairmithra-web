import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  LuBellRing,
  LuCalendarClock,
  LuCheck,
  LuHandCoins,
  LuHeadset,
  LuInfo,
  LuPhone,
  LuPhoneCall,
  LuShieldCheck,
  LuSmile,
  LuStar,
  LuThumbsUp,
  LuUserCheck,
} from "react-icons/lu";

import logo from "../../assets/images/repairmithra-logo.png";
import { SUPPORT } from "../../config/site";
import { getBooking } from "../../utils/bookingStorage";
import { formatDate, formatINR } from "../../utils/format";

const NEXT_STEPS = [
  { icon: LuBellRing, text: "We will notify nearby technicians." },
  { icon: LuPhoneCall, text: "You will get a call/notification once a technician is assigned." },
  { icon: LuCalendarClock, text: "Technician will visit at the scheduled time." },
  { icon: LuHandCoins, text: "After diagnosis, you will pay the repair amount directly to the technician." },
  { icon: LuStar, text: "Rate your experience after service." },
];

const PROMISES = [
  { icon: LuShieldCheck, label: "Trusted Service" },
  { icon: LuUserCheck, label: "Skilled Professionals" },
  { icon: LuThumbsUp, label: "On-Time Support" },
  { icon: LuSmile, label: "Happy Customers" },
];

function BookingConfirmed() {
  const { bookingId } = useParams();
  const booking = getBooking(bookingId);
  const headingRef = useRef(null);

  // Move focus to the confirmation heading so screen-reader users hear it
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

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

  const details = [
    { label: "Booking ID", value: booking.id, strong: true },
    { label: "Service", value: booking.serviceTitle, strong: true },
    { label: "Visit Fee Paid", value: formatINR(booking.payment.amount), strong: true },
    { label: "Date & Time", value: `${formatDate(booking.date)}, ${booking.time}` },
    {
      label: "Address",
      value: `${booking.address}, ${booking.city} - ${booking.pincode}`,
    },
  ];

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
        {/* ------------------------ Booking confirmed ------------------------ */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white">
              <LuCheck size={34} strokeWidth={3} aria-hidden="true" />
            </span>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-4 text-2xl font-extrabold text-green-700 focus:outline-none"
            >
              Booking Confirmed!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Your {booking.serviceTitle} visit has been successfully booked.
            </p>
          </div>

          <dl className="mt-6 space-y-3 rounded-2xl border border-slate-200 p-4 text-sm">
            {details.map(({ label, value, strong }) => (
              <div key={label} className="flex gap-3">
                <dt className="w-28 shrink-0 text-slate-600">{label}</dt>
                <dd
                  className={`min-w-0 flex-1 break-words ${
                    strong ? "font-bold text-slate-900" : "text-slate-800"
                  }`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 p-3.5 text-xs leading-5 text-slate-700">
            <LuInfo size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
            <span>
              We are notifying nearby technicians. You will get updates via
              SMS/Email. You can also track the status in your account.
            </span>
          </p>

          <Link
            to={`/booking/${booking.id}`}
            className="mt-5 block rounded-xl border-2 border-blue-600 py-3 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            View Booking Status
          </Link>
        </section>

        {/* ---------------------------- What's next ---------------------------- */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-blue-800">What's Next?</h2>

          <ol className="mt-6 space-y-5">
            {NEXT_STEPS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="pt-1 text-sm leading-5 text-slate-700">{text}</span>
              </li>
            ))}
          </ol>

          <Link
            to="/services"
            className="mt-8 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Book another service
          </Link>
        </section>

        {/* -------------------------- Help + brand card -------------------------- */}
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-green-100 bg-green-50 p-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <LuHeadset size={22} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-bold text-green-800">Need Help?</h2>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Our support team is here for you.
                  </p>
                  <a
                    href={`mailto:${SUPPORT.email}?subject=${encodeURIComponent(
                      `Help with booking ${booking.id}`
                    )}`}
                    className="mt-3 inline-block rounded-lg border border-green-600 bg-white px-4 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                  >
                    Contact Support
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:border-l sm:border-green-200 sm:pl-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <LuPhone size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-green-800">Call us</p>
                  <a
                    href={SUPPORT.phoneHref}
                    className="mt-1 block whitespace-nowrap text-lg font-extrabold text-slate-900 hover:text-green-700"
                  >
                    {SUPPORT.phone}
                  </a>
                  <p className="text-xs text-slate-600">{SUPPORT.hours}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <img
              src={logo}
              alt="RepairMithra"
              className="mx-auto h-16 w-auto object-contain"
            />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Reliable Home Services. No Hidden Charges.
            </p>

            <ul className="mt-5 grid grid-cols-4 gap-2 border-t border-slate-100 pt-5">
              {PROMISES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-1.5 text-[11px] font-medium leading-4 text-slate-600"
                >
                  <Icon size={20} className="text-slate-500" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmed;
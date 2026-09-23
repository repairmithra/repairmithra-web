import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LuCalendarClock,
  LuCreditCard,
  LuInfo,
  LuLandmark,
  LuLoader,
  LuLock,
  LuMapPin,
  LuSmartphone,
  LuTriangleAlert,
  LuWallet,
} from "react-icons/lu";

import Breadcrumbs from "../../components/booking/Breadcrumbs";
import BookingStepper from "../../components/booking/Bookingstepper";
import ServiceNotFound from "../../components/booking/ServiceNotFound";
import { ServicesError, ServicesLoading } from "../../components/booking/ServicesStatus";
import { SUPPORT } from "../../config/site";
import { useServices } from "../../hooks/useServices";
import { apiFetch, isAuthError } from "../../utils/api";
import { useAuth } from "../../utils/auth";
import { clearDraft, loadDraft, saveDraft } from "../../utils/bookingStorage";
import { formatDate, formatINR } from "../../utils/format";
import { payVisitFee } from "../../utils/payment";

// Shown as reassurance — the customer picks the method inside Razorpay's window.
const METHODS = [
  { label: "UPI", icon: LuSmartphone },
  { label: "Cards", icon: LuCreditCard },
  { label: "Net Banking", icon: LuLandmark },
  { label: "Wallets", icon: LuWallet },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PaymentForm({ service, draft }) {
  const navigate = useNavigate();
  const Icon = service.icon;

  const [paying, setPaying] = useState(false);
  // { tone: "error" | "info", message, statusLink? }
  const [notice, setNotice] = useState(null);

  // Creates the booking on the server (once), then opens Razorpay.
  const handlePay = async () => {
    if (paying) return;

    setPaying(true);
    setNotice(null);

    // Read the draft again: a previous attempt may have saved a bookingId
    // after this component received its `draft` prop.
    const latest = loadDraft(service.slug) ?? draft;

    let bookingId = latest.bookingId;
    let bookingCode = latest.bookingCode;

    try {
      // 1. Create the booking. If an earlier attempt already created one
      //    (e.g. the customer closed the payment window), reuse it.
      if (!bookingId) {
        const { booking } = await apiFetch("/api/bookings", {
          method: "POST",
          auth: true,
          body: {
            serviceId: service.id,
            address: draft.address,
            city: draft.city,
            pincode: draft.pincode,
            latitude: draft.latitude,
            longitude: draft.longitude,
            bookingDate: draft.date,
            timeSlot: draft.time,
            notes: draft.notes,
          },
        });

        bookingId = booking._id;
        bookingCode = booking.bookingCode;

        saveDraft({ ...latest, bookingId, bookingCode });
      }

      // 2. Pay the visit fee with Razorpay (creates the order, opens checkout,
      //    verifies the payment on the server)
      await payVisitFee(bookingId);

      // 3. Done
      clearDraft();
      navigate(`/booking/${bookingId}/confirmation`, { replace: true });
    } catch (err) {
      // Session expired → the page wrapper sends the user to log in
      if (isAuthError(err)) return;

      const reference = bookingCode || bookingId;

      if (err.code === "cancelled") {
        setNotice({
          tone: "info",
          message:
            "The payment window was closed and you haven't been charged. Your booking details are saved — tap Pay whenever you're ready.",
        });
      } else if (err.code === "verification") {
        setNotice({
          tone: "error",
          message: `We received your payment but couldn't confirm it just yet. Please don't pay again — check your booking status below, or contact us on ${SUPPORT.phone} (${SUPPORT.email}) with reference ${reference}.`,
          statusLink: bookingId ? `/booking/${bookingId}` : null,
        });
      } else {
        setNotice({
          tone: "error",
          message: err.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Services", to: "/services" },
            { label: service.title, to: `/services/${service.slug}` },
            { label: "Book Service", to: `/services/${service.slug}/book` },
            { label: "Payment" },
          ]}
        />

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <BookingStepper current={2} />

          {/* Summary */}
          <section className="mt-8" aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="text-sm font-bold text-slate-900">
              Payment Summary
            </h2>

            <div className="mt-3 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <span
                  className={`flex h-14 w-20 shrink-0 items-center justify-center rounded-xl ${service.tone}`}
                >
                  <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <p className="font-bold text-slate-900">{service.title}</p>
              </div>

              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-slate-700">Visit Fee (Pay Now)</dt>
                  <dd className="font-bold text-slate-900">{formatINR(service.visitFee)}</dd>
                </div>

                <div className="flex items-start gap-3">
                  <dt className="flex w-36 shrink-0 items-start gap-2 font-semibold text-slate-700 sm:w-44">
                    <LuMapPin size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                    Service Address
                  </dt>
                  <dd className="min-w-0 flex-1 text-slate-600">
                    {draft.address}, {draft.city} - {draft.pincode}
                  </dd>
                  <Link
                    to={`/services/${service.slug}/book`}
                    className="shrink-0 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Edit<span className="sr-only"> service address</span>
                  </Link>
                </div>

                <div className="flex items-start gap-3">
                  <dt className="flex w-36 shrink-0 items-start gap-2 font-semibold text-slate-700 sm:w-44">
                    <LuCalendarClock size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                    Scheduled Date & Time
                  </dt>
                  <dd className="min-w-0 flex-1 text-slate-600">
                    {formatDate(draft.date)}, {draft.time}
                  </dd>
                  <Link
                    to={`/services/${service.slug}/book`}
                    className="shrink-0 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Edit<span className="sr-only"> date and time</span>
                  </Link>
                </div>
              </dl>
            </div>
          </section>

          {/* How you pay */}
          <section className="mt-8" aria-labelledby="pay-heading">
            <h2 id="pay-heading" className="text-lg font-bold text-slate-900">
              Pay {formatINR(service.visitFee)}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You&apos;ll complete the payment in Razorpay&apos;s secure window and
              choose how to pay there. We never see or store your card details.
            </p>

            <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {METHODS.map(({ label, icon: MethodIcon }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-xs font-medium text-slate-700"
                >
                  <MethodIcon size={20} className="text-slate-500" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          {notice && (
            <div
              role={notice.tone === "error" ? "alert" : "status"}
              className={`mt-5 flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm leading-5 ${
                notice.tone === "error"
                  ? "bg-red-50 text-red-800"
                  : "bg-blue-50 text-blue-900"
              }`}
            >
              {notice.tone === "error" ? (
                <LuTriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <LuInfo size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {notice.message}
                {notice.statusLink && (
                  <>
                    {" "}
                    <Link
                      to={notice.statusLink}
                      className="font-semibold underline underline-offset-2"
                    >
                      Check booking status
                    </Link>
                  </>
                )}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-wait disabled:opacity-80"
          >
            {paying ? (
              <>
                <LuLoader size={20} className="animate-spin" aria-hidden="true" />
                Processing payment...
              </>
            ) : (
              <>
                <LuLock size={20} aria-hidden="true" />
                Pay {formatINR(service.visitFee)}
              </>
            )}
          </button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <LuLock size={12} aria-hidden="true" />
            100% Secure Payment
          </p>
        </div>
      </div>
    </div>
  );
}

function Payment() {
  const { slug } = useParams();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { isLoading, error, reload, getServiceBySlug } = useServices();

  // Session ended — log in again, then come straight back to this page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) return <ServicesLoading />;
  if (error) return <ServicesError message={error} onRetry={reload} />;

  const service = getServiceBySlug(slug);

  if (!service) return <ServiceNotFound />;

  // Opened directly (or the session ended) — send them back to fill in the address first
  const draft = loadDraft(service.slug);
  if (!draft || draft.latitude == null || draft.longitude == null) {
    return <Navigate to={`/services/${service.slug}/book`} replace />;
  }

  return <PaymentForm key={service.slug} service={service} draft={draft} />;
}

export default Payment;
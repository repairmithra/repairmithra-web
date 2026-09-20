import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  LuCreditCard,
  LuLandmark,
  LuLoader,
  LuLock,
  LuCalendarClock,
  LuMapPin,
  LuSmartphone,
  LuWallet,
  LuTriangleAlert,
} from "react-icons/lu";

import Breadcrumbs from "../../components/booking/Breadcrumbs";
import BookingStepper from "../../components/booking/BookingStepper";
import ServiceNotFound from "../../components/booking/ServiceNotFound";
import { DEMO_PAYMENTS } from "../../config/site";
import { getServiceBySlug } from "../../data/servicesData";
import { clearDraft, createBooking, loadDraft } from "../../utils/bookingStorage";
import { formatDate, formatINR } from "../../utils/format";

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const METHODS = [
  { id: "upi", label: "UPI", hint: "(GPay, PhonePe, Paytm, etc.)", icon: LuSmartphone },
  { id: "card", label: "Credit / Debit Card", hint: "", icon: LuCreditCard },
  { id: "netbanking", label: "Net Banking", hint: "", icon: LuLandmark },
  { id: "wallet", label: "Wallet", hint: "(Amazon Pay, etc.)", icon: LuWallet },
];

const UPI_APPS = ["GPay", "PhonePe", "Paytm"];

const BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "IDFC FIRST Bank",
];

const WALLETS = ["Amazon Pay", "Paytm Wallet", "PhonePe Wallet", "Mobikwik"];

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
  }`;

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const isExpiryValid = (value) => {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  // A card is valid through the last day of its expiry month
  return new Date(year, month, 0, 23, 59, 59) >= new Date();
};

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PaymentForm({ service, draft }) {
  const navigate = useNavigate();
  const Icon = service.icon;
  const timerRef = useRef(null);

  const [method, setMethod] = useState("upi");
  const [fields, setFields] = useState({
    upiId: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
    bank: "",
    wallet: WALLETS[0],
  });
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const setField = (name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const next = {};

    if (method === "upi") {
      if (!/^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/.test(fields.upiId.trim())) {
        next.upiId = "Enter a valid UPI ID, like name@okaxis";
      }
    }

    if (method === "card") {
      const digits = fields.cardNumber.replace(/\s/g, "");
      if (digits.length < 13 || digits.length > 19) next.cardNumber = "Enter a valid card number";
      if (!isExpiryValid(fields.cardExpiry)) next.cardExpiry = "Enter a valid expiry (MM/YY)";
      if (!/^[0-9]{3,4}$/.test(fields.cardCvv)) next.cardCvv = "Enter the 3 or 4 digit CVV";
      if (fields.cardName.trim().length < 2) next.cardName = "Enter the name on the card";
    }

    if (method === "netbanking" && !fields.bank) next.bank = "Select your bank";
    if (method === "wallet" && !fields.wallet) next.wallet = "Select a wallet";

    setErrors(next);

    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();

    return !firstInvalid;
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (paying || !validate()) return;

    setPaying(true);

    // Demo: pretend to talk to a payment gateway, then confirm the booking.
    // Replace this timeout with your gateway call when you integrate one.
    timerRef.current = setTimeout(() => {
      const label = METHODS.find((m) => m.id === method).label;
      const booking = createBooking({ service, draft, payment: { method: label } });

      clearDraft();
      navigate(`/booking/${booking.id}/confirmation`, { replace: true });
    }, 1800);
  };

  const describedBy = (name) => (errors[name] ? `${name}-error` : undefined);

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

        <form
          onSubmit={handlePay}
          noValidate
          className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
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

          {/* Payment methods */}
          <fieldset className="mt-8" disabled={paying}>
            <legend className="text-lg font-bold text-slate-900">
              Pay {formatINR(service.visitFee)}
            </legend>

            <div className="mt-4 space-y-2.5">
              {METHODS.map(({ id, label, hint, icon: MethodIcon }) => {
                const selected = method === id;

                return (
                  <div key={id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                        selected
                          ? "border-green-600 bg-green-50/40"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={id}
                        checked={selected}
                        onChange={() => {
                          setMethod(id);
                          setErrors({});
                        }}
                        className="h-4 w-4 accent-green-600"
                      />
                      <MethodIcon size={20} className="shrink-0 text-slate-500" aria-hidden="true" />
                      <span className="text-sm text-slate-800">
                        <span className="font-medium">{label}</span>{" "}
                        {hint && <span className="text-slate-500">{hint}</span>}
                      </span>

                      {id === "upi" && (
                        <span className="ml-auto hidden items-center gap-1.5 sm:flex" aria-hidden="true">
                          {UPI_APPS.map((app) => (
                            <span
                              key={app}
                              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                            >
                              {app}
                            </span>
                          ))}
                        </span>
                      )}
                    </label>

                    {selected && (
                      <div className="mt-2 rounded-xl bg-slate-50 p-4">
                        {id === "upi" && (
                          <Field id="upiId" label="UPI ID" error={errors.upiId}>
                            <input
                              id="upiId"
                              type="text"
                              autoComplete="off"
                              value={fields.upiId}
                              onChange={(e) => setField("upiId", e.target.value)}
                              placeholder="yourname@okaxis"
                              aria-invalid={Boolean(errors.upiId)}
                              aria-describedby={describedBy("upiId")}
                              className={inputClass(errors.upiId)}
                            />
                          </Field>
                        )}

                        {id === "card" && (
                          <div className="space-y-4">
                            <Field id="cardNumber" label="Card number" error={errors.cardNumber}>
                              <input
                                id="cardNumber"
                                type="text"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                value={fields.cardNumber}
                                onChange={(e) => setField("cardNumber", formatCardNumber(e.target.value))}
                                placeholder="1234 5678 9012 3456"
                                aria-invalid={Boolean(errors.cardNumber)}
                                aria-describedby={describedBy("cardNumber")}
                                className={inputClass(errors.cardNumber)}
                              />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                              <Field id="cardExpiry" label="Expiry" error={errors.cardExpiry}>
                                <input
                                  id="cardExpiry"
                                  type="text"
                                  inputMode="numeric"
                                  autoComplete="cc-exp"
                                  value={fields.cardExpiry}
                                  onChange={(e) => setField("cardExpiry", formatExpiry(e.target.value))}
                                  placeholder="MM/YY"
                                  aria-invalid={Boolean(errors.cardExpiry)}
                                  aria-describedby={describedBy("cardExpiry")}
                                  className={inputClass(errors.cardExpiry)}
                                />
                              </Field>

                              <Field id="cardCvv" label="CVV" error={errors.cardCvv}>
                                <input
                                  id="cardCvv"
                                  type="password"
                                  inputMode="numeric"
                                  autoComplete="cc-csc"
                                  maxLength={4}
                                  value={fields.cardCvv}
                                  onChange={(e) => setField("cardCvv", e.target.value.replace(/\D/g, ""))}
                                  placeholder="•••"
                                  aria-invalid={Boolean(errors.cardCvv)}
                                  aria-describedby={describedBy("cardCvv")}
                                  className={inputClass(errors.cardCvv)}
                                />
                              </Field>
                            </div>

                            <Field id="cardName" label="Name on card" error={errors.cardName}>
                              <input
                                id="cardName"
                                type="text"
                                autoComplete="cc-name"
                                value={fields.cardName}
                                onChange={(e) => setField("cardName", e.target.value)}
                                placeholder="As printed on the card"
                                aria-invalid={Boolean(errors.cardName)}
                                aria-describedby={describedBy("cardName")}
                                className={inputClass(errors.cardName)}
                              />
                            </Field>
                          </div>
                        )}

                        {id === "netbanking" && (
                          <Field id="bank" label="Choose your bank" error={errors.bank}>
                            <select
                              id="bank"
                              value={fields.bank}
                              onChange={(e) => setField("bank", e.target.value)}
                              aria-invalid={Boolean(errors.bank)}
                              aria-describedby={describedBy("bank")}
                              className={inputClass(errors.bank)}
                            >
                              <option value="">Select bank</option>
                              {BANKS.map((bank) => (
                                <option key={bank} value={bank}>
                                  {bank}
                                </option>
                              ))}
                            </select>
                          </Field>
                        )}

                        {id === "wallet" && (
                          <Field id="wallet" label="Choose your wallet" error={errors.wallet}>
                            <select
                              id="wallet"
                              value={fields.wallet}
                              onChange={(e) => setField("wallet", e.target.value)}
                              aria-invalid={Boolean(errors.wallet)}
                              aria-describedby={describedBy("wallet")}
                              className={inputClass(errors.wallet)}
                            >
                              {WALLETS.map((wallet) => (
                                <option key={wallet} value={wallet}>
                                  {wallet}
                                </option>
                              ))}
                            </select>
                          </Field>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          {DEMO_PAYMENTS && (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
              <LuTriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-semibold">Demo payment.</strong> No money is charged and
                your payment details are not saved or sent anywhere.
              </span>
            </p>
          )}

          <button
            type="submit"
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
        </form>
      </div>
    </div>
  );
}

function Payment() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);

  if (!service) return <ServiceNotFound />;

  // Opened directly (or the session ended) — send them back to fill in the address first
  const draft = loadDraft(service.slug);
  if (!draft) return <Navigate to={`/services/${service.slug}/book`} replace />;

  return <PaymentForm key={service.slug} service={service} draft={draft} />;
}

export default Payment;
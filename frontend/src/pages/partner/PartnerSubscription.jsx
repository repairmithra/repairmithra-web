import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiLock,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

import { getToken } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import PartnerHeader from "./components/PartnerHeader";
import { getPartnerSubscription, getServices } from "./partnerApi";
import { paySubscription } from "./partnerSubscriptionPayment";

// Colours per plan, following the plan poster. Full class names are written
// out so Tailwind can see them.
const PLAN_STYLE = {
  single: { head: "bg-sky-100 text-sky-900", price: "text-sky-600", pill: "bg-sky-50 text-sky-900", check: "text-sky-600", btn: "bg-sky-600 hover:bg-sky-700", ring: "ring-sky-400" },
  two: { head: "bg-emerald-100 text-emerald-900", price: "text-emerald-600", pill: "bg-emerald-50 text-emerald-900", check: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700", ring: "ring-emerald-400" },
  three: { head: "bg-amber-100 text-amber-900", price: "text-orange-500", pill: "bg-amber-50 text-amber-900", check: "text-orange-500", btn: "bg-orange-500 hover:bg-orange-600", ring: "ring-orange-400" },
  four: { head: "bg-violet-100 text-violet-900", price: "text-violet-600", pill: "bg-violet-50 text-violet-900", check: "text-violet-600", btn: "bg-violet-600 hover:bg-violet-700", ring: "ring-violet-400" },
  five: { head: "bg-rose-100 text-rose-900", price: "text-rose-600", pill: "bg-rose-50 text-rose-900", check: "text-rose-600", btn: "bg-rose-600 hover:bg-rose-700", ring: "ring-rose-400" },
  all: { head: "bg-teal-100 text-teal-900", price: "text-teal-700", pill: "bg-teal-50 text-teal-900", check: "text-teal-600", btn: "bg-teal-700 hover:bg-teal-800", ring: "ring-teal-400" },
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

const serviceCountLabel = (plan) =>
  plan.serviceLimit == null ? "All services" : `${plan.serviceLimit} service${plan.serviceLimit > 1 ? "s" : ""}`;

const idsOf = (list) =>
  (list || []).map((x) => (typeof x === "string" ? x : x?._id)).filter(Boolean);

function PartnerSubscription() {
  const navigate = useNavigate();
  const location = useLocation();
  // Set when the partner was sent here from a request they could not accept.
  const returnTo = location.state?.returnTo || "";

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [services, setServices] = useState([]);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [paying, setPaying] = useState(false);
  const checkoutRef = useRef(null);

  const load = useCallback(
    async (signal) => {
      try {
        const [subRes, svcRes] = await Promise.all([
          getPartnerSubscription(signal),
          getServices(signal),
        ]);
        setPlans(subRes.data.plans || []);
        setSubscription(subRes.data.subscription);
        setRegisteredIds(idsOf(subRes.data.registeredServices));
        setServices(svcRes.services || []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true, state: { from: "/partner/subscription" } });
          return;
        }
        setError(err.message || "Failed to load subscription plans");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!getToken()) {
      navigate("/partner/login", { replace: true, state: { from: "/partner/subscription" } });
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, navigate]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.key === selectedKey) || null,
    [plans, selectedKey]
  );

  const active = subscription?.active;
  const currentPlan = plans.find((p) => p.key === subscription?.plan);

  const handleSelectPlan = (plan) => {
    setError("");
    setSuccess("");
    setSelectedKey(plan.key);

    if (plan.serviceLimit == null) {
      setSelectedServiceIds([]);
    } else {
      // Start from what the partner already has (current plan, else the
      // services chosen at sign-up), trimmed to what this plan allows.
      const base = active && subscription?.services?.length
        ? idsOf(subscription.services)
        : registeredIds;
      setSelectedServiceIds(base.slice(0, plan.serviceLimit));
    }

    setTimeout(() => checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const toggleService = (id) => {
    if (!selectedPlan) return;
    setError("");
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= selectedPlan.serviceLimit) return prev;
      return [...prev, id];
    });
  };

  const needsPick = selectedPlan && selectedPlan.serviceLimit != null;
  const pickedEnough = !needsPick || selectedServiceIds.length === selectedPlan.serviceLimit;

  const handlePay = async () => {
    if (!selectedPlan || !pickedEnough) return;
    setPaying(true);
    setError("");
    setSuccess("");

    try {
      const res = await paySubscription(selectedPlan.key, selectedServiceIds);
      setSubscription(res.data.subscription);
      setSuccess(`You're subscribed to the ${selectedPlan.name} plan. You can now accept matching service requests.`);
      setSelectedKey(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (isAuthError(err)) {
        navigate("/partner/login", { replace: true, state: { from: "/partner/subscription" } });
        return;
      }
      if (err?.code === "cancelled") {
        setError("Payment was cancelled. You have not been charged.");
      } else if (err?.code === "verification") {
        setError(`${err.message} If money was deducted, contact support with your payment details.`);
      } else {
        setError(err?.message || "Could not complete the payment. Please try again.");
      }
    } finally {
      setPaying(false);
    }
  };

  const planButtonLabel = (plan) => {
    if (active && plan.key === subscription.plan) return "Renew Plan";
    if (active && currentPlan && plan.price > currentPlan.price) return "Upgrade";
    return "Select Plan";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-500">Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <PartnerHeader
        variant="avatar"
        icon={FiTrendingUp}
        title="Subscription Plans"
        subtitle="Choose the right plan based on the number of services you offer"
      />

      <main className="mx-auto max-w-6xl space-y-5 px-4 pt-2 sm:px-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <FiCheckCircle className="mt-0.5 shrink-0" size={16} />
              {success}
            </span>
            <button
              onClick={() => navigate(returnTo || "/partner/jobs?tab=new")}
              className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {returnTo ? "Back to the request" : "View service requests"}
            </button>
          </div>
        )}

        {/* Current subscription status */}
        <section
          className={`rounded-2xl border p-5 ${
            active ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/70"
          }`}
        >
          {active ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Your current plan
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">
                  {subscription.planName} · ₹{subscription.amount}/month
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {subscription.plan === "all"
                    ? "You can accept every service."
                    : `You can accept: ${
                        (subscription.services || []).map((s) => s.name).filter(Boolean).join(", ") || "—"
                      }`}
                </p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
                <p className="font-semibold text-slate-900">Renews on {formatDate(subscription.expiresAt)}</p>
                <p className="text-slate-500">
                  {subscription.daysLeft} day{subscription.daysLeft === 1 ? "" : "s"} left
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <FiAlertCircle className="mt-0.5 shrink-0 text-amber-600" size={20} />
              <div>
                <p className="font-bold text-slate-900">
                  {subscription?.status === "expired"
                    ? "Your subscription has expired"
                    : "You don't have an active subscription"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  You'll still be notified about every request in your area, but you need an active
                  plan to accept bookings. Pick a plan below to start accepting jobs.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Plan cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const style = PLAN_STYLE[plan.key] || PLAN_STYLE.two;
            const isCurrent = active && subscription.plan === plan.key;
            const isSelected = selectedKey === plan.key;
            const label = serviceCountLabel(plan);

            return (
              <article
                key={plan.key}
                className={`flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.07)] ${
                  isSelected ? `ring-2 ${style.ring}` : ""
                }`}
              >
                <div className={`flex items-center justify-between px-5 py-3 text-base font-bold ${style.head}`}>
                  <span>{plan.name}</span>
                  {isCurrent && (
                    <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold">
                      Current plan
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                  <p className={`text-center text-4xl font-extrabold ${style.price}`}>
                    ₹{plan.price}
                    <span className="block text-sm font-medium text-slate-500">/month</span>
                  </p>

                  <p className={`mt-4 rounded-lg px-3 py-2 text-center text-sm font-bold ${style.pill}`}>
                    {plan.serviceLimit == null ? "All services" : label}
                  </p>

                  <ul className="mt-4 flex-1 space-y-3 text-sm text-slate-700">
                    {[
                      "Receive all service notifications",
                      plan.serviceLimit == null
                        ? "Accept all services"
                        : `Accept ${plan.serviceLimit} subscribed service${plan.serviceLimit > 1 ? "s" : ""}`,
                      "Upgrade anytime",
                    ].map((text) => (
                      <li key={text} className="flex items-start gap-2.5">
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current ${style.check}`}>
                          <FiCheck size={13} strokeWidth={3} />
                        </span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={paying}
                    className={`mt-5 w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 ${style.btn}`}
                  >
                    {planButtonLabel(plan)}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Checkout panel */}
        {selectedPlan && (
          <section
            ref={checkoutRef}
            className="scroll-mt-28 rounded-2xl border border-emerald-200 bg-white p-5 shadow-md sm:p-6"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {planButtonLabel(selectedPlan) === "Upgrade" ? "Upgrade to" : "Subscribe to"}{" "}
                {selectedPlan.name}
              </h2>
              <p className="text-lg font-extrabold text-emerald-700">
                ₹{selectedPlan.price}
                <span className="text-sm font-medium text-slate-500"> / month</span>
              </p>
            </div>

            {needsPick ? (
              <>
                <p className="mt-3 text-sm text-slate-600">
                  Choose the {selectedPlan.serviceLimit} service
                  {selectedPlan.serviceLimit > 1 ? "s" : ""} you want to accept bookings for.{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedServiceIds.length}/{selectedPlan.serviceLimit} selected
                  </span>
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {services.map((service) => {
                    const on = selectedServiceIds.includes(service._id);
                    const full = !on && selectedServiceIds.length >= selectedPlan.serviceLimit;
                    return (
                      <button
                        type="button"
                        key={service._id}
                        onClick={() => toggleService(service._id)}
                        disabled={full}
                        aria-pressed={on}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                          on
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : full
                            ? "cursor-not-allowed border-gray-200 text-slate-300"
                            : "border-gray-300 text-slate-600 hover:border-emerald-300"
                        }`}
                      >
                        {service.name}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                This plan covers all {services.length} services - you can accept every kind of request.
              </p>
            )}

            {active && (
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {selectedPlan.key === subscription.plan
                  ? "Renewing the same plan adds 30 days on top of your current expiry date."
                  : "Switching plans starts a new 30-day period from today. Any time left on your current plan is replaced."}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handlePay}
                disabled={paying || !pickedEnough}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${selectedPlan.price} & Activate`
                )}
              </button>
              <button
                onClick={() => setSelectedKey(null)}
                disabled={paying}
                className="rounded-xl border border-gray-300 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            { icon: FiBell, tone: "bg-sky-50 text-sky-600", title: "Receive All Notifications", text: "You will be notified about every service request in your area, no matter which plan you choose." },
            { icon: FiLock, tone: "bg-emerald-50 text-emerald-600", title: "Accept Only Subscribed Services", text: "You can accept a booking only if your subscription is active and the service is included in your plan." },
            { icon: FiTrendingUp, tone: "bg-amber-50 text-amber-600", title: "Upgrade Anytime", text: "You can upgrade your plan or add more services whenever you need." },
          ].map(({ icon: Icon, tone, title, text }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone}`}>
                <Icon size={22} />
              </span>
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Important notes */}
        <section className="rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
          <p className="flex items-center gap-2 font-bold text-rose-700">
            <FiFileText size={18} /> Important Notes
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            <li>All partners receive notifications for all service requests.</li>
            <li>You can accept bookings only for services included in your active subscription plan.</li>
            <li>If you try to accept a service not in your plan, you will be asked to upgrade your subscription.</li>
            <li>Subscription renews monthly.</li>
            <li>Customer service charges (visit fee) are separate from the partner subscription fee.</li>
          </ol>
        </section>

        <p className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold tracking-widest text-slate-400">
          <FiUsers size={14} /> TRUSTED. SKILLED. ALWAYS THERE.
        </p>
      </main>
    </div>
  );
}

export default PartnerSubscription;
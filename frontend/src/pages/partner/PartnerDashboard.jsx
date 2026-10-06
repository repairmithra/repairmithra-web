import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiInbox,
  FiCheckCircle,
  FiTool,
  FiAward,
  FiTrendingUp,
  FiArrowRight,
  FiAlertCircle,
  FiBriefcase,
  FiStar,
  FiUsers,
  FiArrowUp,
} from "react-icons/fi";
import { LuIndianRupee, LuShieldCheck, LuMapPin, LuClock } from "react-icons/lu";

import { getToken, useAuth } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import PartnerHeader from "./components/PartnerHeader";
import { getPartnerDashboard } from "./partnerApi";
import heroImg from "../../assets/images/partner-hero.jpg";
import trophyImg from "../../assets/images/partner-trophy.png";

const STAT_CARDS = [
  { key: "newRequests", label: "New Requests", sub: "Today", to: "/partner/jobs?tab=new", icon: FiInbox, iconTone: "bg-sky-50 text-sky-600", subTone: "text-sky-600" },
  { key: "acceptedJobs", label: "Accepted Jobs", sub: "Active", to: "/partner/jobs?tab=accepted", icon: FiCheckCircle, iconTone: "bg-emerald-50 text-emerald-600", subTone: "text-emerald-600" },
  { key: "activeServices", label: "Active Services", mobileLabel: "Active Jobs", sub: "Ongoing", to: "/partner/jobs?tab=active", icon: FiTool, iconTone: "bg-orange-50 text-orange-500", subTone: "text-orange-500" },
  { key: "completedJobs", label: "Completed", mobileLabel: "Completed Jobs", sub: "All Time", to: "/partner/jobs?tab=completed", icon: FiAward, iconTone: "bg-violet-50 text-violet-600", subTone: "text-violet-600" },
];

const PERKS = [
  { icon: FiBriefcase, title: "More Jobs", text: "Get priority in new requests" },
  { icon: FiStar, title: "Better Earnings", text: "Earn more with happy customers" },
  { icon: FiUsers, title: "Top Partner", text: "Be among the best service partners" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function PartnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (signal) => {
      try {
        const res = await getPartnerDashboard(signal);
        setData(res.data);
      } catch (err) {
        if (err?.name === "AbortError") return;

        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true, state: { from: "/partner/dashboard" } });
          return;
        }

        setError(err.message || "Failed to load dashboard");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!getToken()) {
      navigate("/partner/login", { replace: true, state: { from: "/partner/dashboard" } });
      return;
    }

    if (user && user.role !== "technician") {
      navigate("/", { replace: true });
      return;
    }

    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, navigate, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  const firstName = (user?.fullName || "Partner").split(" ")[0];
  const stats = data?.stats || {};
  const totalEarnings = stats.totalEarnings ?? 0;
  const change = Number(stats.earningsChange ?? 0);
  const serviceArea = user?.serviceArea || user?.city || data?.serviceArea || "Your city";

  return (
    <div className="min-h-screen bg-white">
      <PartnerHeader
        title={`${greeting()}, ${firstName}! 👋`}
        subtitle="Let's serve more homes today"
      />

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-8 pt-2 sm:px-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-white">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-y-0 right-0 h-full w-[58%] object-cover object-[78%_center] sm:w-3/5 sm:object-center"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 22%)",
              maskImage: "linear-gradient(to right, transparent, #000 22%)",
            }}
          />
          <div className="relative px-5 py-6 sm:w-1/2 sm:px-10 sm:py-14">
            <h1 className="text-[21px] font-extrabold leading-tight text-slate-900 sm:text-4xl">
              Let&apos;s get more
              <br />
              <span className="text-emerald-600">jobs</span> done today!
            </h1>
            <p className="mt-3 max-w-[46%] text-[13px] leading-relaxed text-slate-600 sm:mt-4 sm:max-w-xs sm:text-[15px]">
              You&apos;re doing great! Keep serving and building happy homes.
            </p>
            <button
              onClick={() => navigate("/partner/jobs?tab=new")}
              className="mt-4 inline-flex items-center gap-2.5 rounded-lg bg-emerald-700 py-2.5 pl-4 pr-2.5 text-[13px] font-semibold text-white shadow-md transition hover:bg-emerald-800 sm:mt-6 sm:gap-3 sm:py-3 sm:pl-5 sm:pr-3 sm:text-sm"
            >
              View New Requests
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-700 sm:h-7 sm:w-7">
                <FiArrowRight size={15} />
              </span>
            </button>
          </div>
        </section>

        {/* Service area + response time (phones only; desktop shows this on Service Requests) */}
        <section className="grid grid-cols-2 divide-x divide-gray-200 rounded-2xl border border-gray-100 bg-white py-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:hidden">
          <div className="flex items-start gap-2 px-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <LuMapPin size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">Your Service Area</p>
              <p className="mt-0.5 text-[13px] text-slate-600">{serviceArea}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 px-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <LuClock size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">Response Time</p>
              <p className="mt-0.5 text-[13px] text-slate-600">Quick responses get more jobs!</p>
            </div>
          </div>
        </section>

        {/* Stat cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STAT_CARDS.map(({ key, label, mobileLabel, sub, to, icon: Icon, iconTone, subTone }) => (
            <button
              key={key}
              onClick={() => navigate(to)}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-left sm:p-5 shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition hover:shadow-md"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${iconTone}`}>
                <Icon size={22} />
              </span>
              <p className="mt-4 text-2xl font-bold text-slate-900 sm:mt-5 sm:text-3xl">{stats[key] ?? 0}</p>
              <p className="mt-0.5 text-[13px] text-slate-600 sm:mt-1 sm:text-sm">
                <span className="sm:hidden">{mobileLabel || label}</span>
                <span className="hidden sm:inline">{label}</span>
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-[13px] font-semibold sm:text-sm ${subTone}`}>
                  <span className="sm:hidden">View All</span>
                  <span className="hidden sm:inline">{sub}</span>
                </span>
                <FiArrowRight size={16} className="text-slate-700" />
              </div>
            </button>
          ))}
        </section>

        {/* Total earnings */}
        <section className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-emerald-50/30 px-4 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] sm:gap-0 sm:px-6 sm:py-5">
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 sm:h-20 sm:w-20">
              <LuIndianRupee className="h-6 w-6 sm:h-8 sm:w-8" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-700 sm:text-sm sm:text-slate-900">Total Earnings</p>
              <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                ₹{Number(totalEarnings).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-slate-500 sm:text-sm">All time earnings</p>
            </div>
          </div>

          <div className="relative min-w-0 flex-1 sm:ml-10">
            <span className="absolute right-0 top-0 inline-flex items-center gap-0.5 whitespace-nowrap rounded-md bg-emerald-100/70 px-2 py-0.5 text-[10px] font-medium text-slate-700 sm:left-[22%] sm:right-auto sm:px-3 sm:py-1 sm:text-xs">
              {change > 0 && <FiArrowUp size={11} className="text-emerald-600" />}
              <span className={change > 0 ? "font-semibold text-emerald-600" : ""}>{change}%</span> vs last 30 days
            </span>
            <svg viewBox="0 0 460 90" className="mt-6 h-14 w-full sm:mt-5 sm:h-20" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 80 C40 72 70 64 110 56 C150 48 170 62 215 50 C255 40 280 34 320 44 C360 54 385 40 425 20 L440 12"
                fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"
              />
              <path
                d="M0 80 C40 72 70 64 110 56 C150 48 170 62 215 50 C255 40 280 34 320 44 C360 54 385 40 425 20 L440 12 L440 90 L0 90 Z"
                fill="url(#earnFill)"
              />
              <circle cx="440" cy="12" r="5" fill="#fff" stroke="#059669" strokeWidth="2" />
            </svg>
            <button
              onClick={() => navigate("/partner/earnings")}
              aria-label="View earnings"
              className="absolute bottom-0 right-0 hidden h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600 sm:flex shadow-md transition hover:bg-emerald-50"
            >
              <FiTrendingUp size={20} />
            </button>
          </div>
        </section>

        {/* Keep going */}
        <section className="hidden flex-col gap-5 rounded-2xl border border-amber-50 bg-amber-50/30 p-5 sm:flex lg:flex-row lg:items-center">
          <div className="flex items-center gap-5 lg:w-[38%]">
            <img src={trophyImg} alt="" className="h-24 w-auto shrink-0 mix-blend-multiply" />
            <div>
              <p className="font-bold text-slate-900">Keep going!</p>
              <p className="text-sm text-slate-600">Complete more jobs and unlock exciting rewards.</p>
              <button
                onClick={() => navigate("/partner/grow")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                View Leaderboard
                <FiArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Respond-quickly tip (phones) */}
        <section className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-emerald-50/30 p-3.5 sm:hidden">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
            <LuShieldCheck size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-slate-900">Respond quickly to get more jobs!</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-600">
              Fast responses improve your rating and bring more customers.
            </p>
          </div>
          <button
            onClick={() => navigate("/partner/grow")}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 py-2.5 text-xs font-semibold text-emerald-700"
          >
            How it works?
            <FiArrowRight size={14} />
          </button>
        </section>
      </main>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} RepairMithra. All rights reserved.</p>
          <p className="flex items-center gap-3">
            <a href="/privacy" className="hover:text-emerald-700">Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="hover:text-emerald-700">Terms &amp; Conditions</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PartnerDashboard;
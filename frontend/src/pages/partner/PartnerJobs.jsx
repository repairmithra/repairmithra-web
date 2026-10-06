import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiAlertCircle, FiChevronDown } from "react-icons/fi";
import {
  LuAirVent,
  LuCalendar,
  LuClipboardList,
  LuClock,
  LuDroplets,
  LuFan,
  LuIndianRupee,
  LuInfo,
  LuListFilter,
  LuMapPin,
  LuNavigation,
  LuPaintRoller,
  LuRefreshCw,
  LuRefrigerator,
  LuShieldCheck,
  LuTrendingUp,
  LuTv,
  LuWashingMachine,
  LuWrench,
  LuZap,
} from "react-icons/lu";

import { getToken, useAuth } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import PartnerHeader from "./components/PartnerHeader";
import { getPartnerJobs, acceptPartnerJob } from "./partnerApi";
import heroImg from "../../assets/images/partner-requests-hero.jpg";

const TABS = [
  { key: "new", label: "New Requests" },
  { key: "accepted", label: "Accepted" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

const STATUS_LABEL = {
  confirmed: "New Request",
  technician_assigned: "Accepted",
  technician_on_the_way: "On the way",
  technician_arrived: "Arrived",
  inspection_completed: "Inspected",
  repair_in_progress: "In progress",
  completed: "Completed",
};

const PRIORITY = {
  high: { label: "High Priority", cls: "bg-emerald-50 text-emerald-700" },
  medium: { label: "Medium Priority", cls: "bg-sky-50 text-sky-700" },
  normal: { label: "Normal Priority", cls: "bg-amber-50 text-amber-600" },
};

// Icon + colour for the square service badge on the left of each card.
const SERVICE_ICONS = [
  { match: /electric|wiring|switch/i, icon: LuZap, tone: "bg-violet-50 text-violet-600" },
  { match: /plumb|\btap\b|water/i, icon: LuDroplets, tone: "bg-emerald-50 text-emerald-600" },
  { match: /\bac\b|air[ -]?con/i, icon: LuAirVent, tone: "bg-sky-50 text-sky-600" },
  { match: /fan/i, icon: LuFan, tone: "bg-sky-50 text-sky-600" },
  { match: /tv|television/i, icon: LuTv, tone: "bg-violet-50 text-violet-600" },
  { match: /fridge|refrigerat/i, icon: LuRefrigerator, tone: "bg-sky-50 text-sky-600" },
  { match: /wash/i, icon: LuWashingMachine, tone: "bg-emerald-50 text-emerald-600" },
  { match: /paint/i, icon: LuPaintRoller, tone: "bg-amber-50 text-amber-600" },
];

const serviceBadge = (name = "") =>
  SERVICE_ICONS.find((s) => s.match.test(name)) || {
    icon: LuWrench,
    tone: "bg-emerald-50 text-emerald-600",
  };

// Jobs for today are the most urgent, tomorrow next, everything else normal.
function getPriority(b) {
  if (!b.bookingDate) return "normal";
  const d = new Date(b.bookingDate);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86_400_000);
  if (diff <= 0) return "high";
  if (diff === 1) return "medium";
  return "normal";
}

const pad = (n) => String(n).padStart(2, "0");

// "06 Oct 2026, 10:30 AM"
function formatRequested(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.toLocaleString("en-US", { month: "short" });
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${pad(d.getDate())} ${month} ${d.getFullYear()}, ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

function timeAgo(dateStr) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function budgetLabel(b) {
  const min = b.service?.estimatedCostMin;
  const max = b.service?.estimatedCostMax;
  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  if (min != null && max != null) return `${fmt(min)} - ${fmt(max)}`;
  if (b.finalRepairAmount != null) return fmt(b.finalRepairAmount);
  if (b.service?.visitFee != null) return fmt(b.service.visitFee);
  return "—";
}

function PartnerJobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const urlTab = searchParams.get("tab");
  const [tab, setTab] = useState(TABS.some((t) => t.key === urlTab) ? urlTab : "new");

  // Header/drawer links change ?tab= while this page stays mounted.
  useEffect(() => {
    if (TABS.some((x) => x.key === urlTab)) setTab(urlTab);
  }, [urlTab]);

  const [jobs, setJobs] = useState({ new: [], accepted: [], active: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const [sort, setSort] = useState("newest");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const load = useCallback(
    async (signal) => {
      setError("");
      try {
        // One call per tab so every tab can show its count badge.
        const results = await Promise.all(
          TABS.map((t) => getPartnerJobs(t.key, signal))
        );
        const next = {};
        TABS.forEach((t, i) => {
          next[t.key] = results[i].bookings || [];
        });
        setJobs(next);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true, state: { from: "/partner/jobs" } });
          return;
        }
        setError(err.message || "Failed to load requests");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!getToken()) {
      navigate("/partner/login", { replace: true, state: { from: "/partner/jobs" } });
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, navigate]);

  // Close the filter popover on outside click.
  useEffect(() => {
    if (!filterOpen) return undefined;
    const onDown = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filterOpen]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAccept = async (id) => {
    setActioningId(id);
    try {
      await acceptPartnerJob(id);
      navigate(`/partner/jobs/${id}`);
    } catch (err) {
      setError(err.message || "Could not accept the job");
    } finally {
      setActioningId(null);
    }
  };

  const visible = useMemo(() => {
    let list = [...(jobs[tab] || [])];
    if (priorityFilter !== "all") list = list.filter((b) => getPriority(b) === priorityFilter);
    list.sort((a, b) => {
      const diff = new Date(b.createdAt) - new Date(a.createdAt);
      return sort === "newest" ? diff : -diff;
    });
    return list;
  }, [jobs, tab, sort, priorityFilter]);

  const serviceArea =
    user?.serviceArea ||
    user?.city ||
    [...jobs.new, ...jobs.accepted].find((b) => b.city)?.city ||
    "Your city";

  return (
    <div className="min-h-screen overflow-x-clip bg-white pb-6">
      <PartnerHeader
        variant="avatar"
        icon={LuClipboardList}

      />

      <main className="mx-auto w-full min-w-0 max-w-6xl space-y-5 px-4 pt-2 sm:px-6">
        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-white">
          {/* Phones: technician beside the text, like the Dashboard */}
          <img
            src={heroImg}
            alt=""
            className="absolute inset-y-0 left-[45%] h-full w-auto max-w-none sm:hidden"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 22%)",
              maskImage: "linear-gradient(to right, transparent, #000 22%)",
            }}
          />
          <img
            src={heroImg}
            alt=""
            className="absolute inset-y-0 right-0 hidden h-full w-[44%] object-cover object-left lg:block"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 35%)",
              maskImage: "linear-gradient(to right, transparent, #000 35%)",
            }}
          />
          <div className="relative flex flex-col gap-5 px-5 py-6 sm:gap-6 sm:px-10 sm:py-8 lg:flex-row lg:items-center">
            <div className="lg:w-[34%]">
              <h1 className="text-[22px] font-extrabold leading-tight text-slate-900 sm:text-3xl">
                New customers are
                <br />
                looking for <span className="text-emerald-600">your help!</span>
              </h1>
              <p className="mt-3 max-w-[52%] text-[13px] leading-relaxed text-slate-600 sm:mt-4 sm:max-w-sm sm:text-[15px]">
                Check the latest service requests in your area and grow your business.
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-[13px] sm:mt-5 sm:px-5 sm:py-3 sm:text-sm font-semibold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-70"
              >
                <LuRefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh Requests
              </button>
            </div>

            <div className="hidden w-full space-y-4 rounded-xl bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.08)] sm:block sm:max-w-[16rem] sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <LuMapPin size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Your Service Area</p>
                  <p className="mt-1 text-sm text-slate-600">{serviceArea}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <LuClock size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Response Time</p>
                  <p className="mt-1 text-sm text-slate-600">Quick responses get more jobs!</p>
                </div>
              </div>
            </div>

            {/* Technician photo for phones/tablets (desktop uses the side image above) */}
            <img
              src={heroImg}
              alt=""
              className="-mx-10 -mb-8 mt-1 hidden h-64 w-[calc(100%+5rem)] max-w-none object-cover object-[26%_center] sm:block lg:hidden"
              style={{
                WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 30%)",
                maskImage: "linear-gradient(to bottom, transparent, #000 30%)",
              }}
            />
          </div>
        </section>

        {/* Service area + response time (phones) */}
        <section className="grid grid-cols-2 divide-x divide-gray-200 rounded-2xl border border-gray-100 bg-white py-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] sm:hidden">
          <div className="flex items-start gap-2.5 px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <LuMapPin size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">Your Service Area</p>
              <p className="mt-0.5 break-words text-[13px] text-slate-600">{serviceArea}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <LuClock size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900">Response Time</p>
              <p className="mt-0.5 text-[13px] text-slate-600">Quick responses get more jobs!</p>
            </div>
          </div>
        </section>

        {/* Tabs + sort/filter */}
        <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="grid min-w-0 grid-cols-2 gap-1 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:flex sm:max-w-full sm:overflow-x-auto sm:rounded-full">
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = jobs[t.key]?.length ?? 0;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition sm:px-5 sm:text-[15px] ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                  <span
                    className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                      active ? "bg-emerald-700 text-white" : "bg-gray-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative flex items-center gap-3" ref={filterRef}>
            <label className="relative flex flex-1 items-center rounded-lg sm:flex-none border border-gray-200 bg-white pl-4 pr-9 text-sm text-slate-600 shadow-sm">
              Sort by:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-11 cursor-pointer appearance-none bg-transparent pl-2 pr-2 font-medium text-slate-900 outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <FiChevronDown size={16} className="pointer-events-none absolute right-3 text-slate-700" />
            </label>

            <button
              onClick={() => setFilterOpen((v) => !v)}
              aria-label="Filter requests"
              className={`flex h-11 w-12 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm transition hover:bg-emerald-50 ${
                priorityFilter !== "all" ? "border-emerald-600 text-emerald-700" : "border-gray-200 text-slate-800"
              }`}
            >
              <LuListFilter size={20} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                {[
                  ["all", "All priorities"],
                  ["high", "High Priority"],
                  ["medium", "Medium Priority"],
                  ["normal", "Normal Priority"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setPriorityFilter(value);
                      setFilterOpen(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-emerald-50 ${
                      priorityFilter === value ? "font-semibold text-emerald-700" : "text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Request cards */}
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading requests...</p>
        ) : visible.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 py-12 text-center text-sm text-slate-500">
            Nothing here yet.
          </p>
        ) : (
          <div className="space-y-4">
            {visible.map((b) => {
              const { icon: Icon, tone } = serviceBadge(b.service?.name);
              const priority = PRIORITY[getPriority(b)];
              const isNew = tab === "new";
              const distance = b.distanceKm ?? b.distance;

              return (
                <article
                  key={b._id}
                  className="relative grid min-w-0 grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.1fr)_150px_200px_72px] lg:items-center lg:gap-5 lg:p-5"
                >
                  {/* Service */}
                  <div className="flex min-w-0 items-center gap-4 pr-16 lg:gap-5 lg:pr-0">
                    <span className={`flex h-14 w-14 shrink-0 lg:h-[76px] lg:w-[76px] items-center justify-center rounded-2xl ${tone}`}>
                      <Icon className="h-7 w-7 lg:h-9 lg:w-9" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-slate-900">{b.service?.name}</p>
                      <p className="mt-0.5 break-words text-sm text-slate-700 lg:truncate">
                        {b.notes || b.timeSlot || `#${b.bookingCode}`}
                      </p>
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600 lg:items-center">
                        <LuMapPin size={13} className="mt-0.5 shrink-0 lg:mt-0" />
                        <span className="min-w-0 break-words lg:truncate">
                          {b.address}
                          {b.city ? `, ${b.city}` : ""}
                        </span>
                      </p>
                      {distance != null && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <LuNavigation size={12} />
                          {Number(distance).toFixed(1)} km away
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Requested on + budget */}
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-gray-100 pt-4 lg:block lg:space-y-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <div className="flex items-start gap-3">
                      <LuCalendar size={16} className="mt-0.5 shrink-0 text-slate-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Requested On</p>
                        <p className="mt-0.5 text-[13px] text-slate-600 sm:text-sm">{formatRequested(b.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <LuIndianRupee size={16} className="mt-0.5 shrink-0 text-slate-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Budget</p>
                        <p className="mt-0.5 whitespace-nowrap text-[15px] font-bold text-slate-900">{budgetLabel(b)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Priority / status pill */}
                  <div className="-mt-1 lg:mt-0 lg:self-start lg:pt-1">
                    {isNew ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${priority.cls}`}>
                        <LuTrendingUp size={14} />
                        {priority.label}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600">
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`grid gap-3 lg:block lg:space-y-2.5 lg:border-l lg:border-gray-100 lg:pl-5 ${isNew ? "grid-cols-2" : "grid-cols-1"}`}>
                    {isNew && (
                      <button
                        onClick={() => handleAccept(b._id)}
                        disabled={actioningId === b._id}
                        className="w-full rounded-md bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                      >
                        Accept Request
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/partner/jobs/${b._id}`)}
                      className="w-full rounded-md border border-emerald-600 bg-white py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Time ago */}
                  <p className="absolute right-4 top-4 whitespace-nowrap text-xs text-slate-500 lg:static lg:self-start lg:border-l lg:border-gray-100 lg:pl-5 lg:pt-3">
                    {timeAgo(b.createdAt)}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {/* Tip banner */}
        <section className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <LuShieldCheck size={28} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Respond quickly to get more jobs!</p>
              <p className="text-sm text-slate-600">
                Fast responses improve your rating and bring more customers.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/partner/grow")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white px-8 py-3 sm:w-auto text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <LuInfo size={18} />
            How it works?
          </button>
        </section>
      </main>
    </div>
  );
}

export default PartnerJobs;
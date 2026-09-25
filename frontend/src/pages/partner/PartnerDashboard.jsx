import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiInbox,
  FiCheckCircle,
  FiTool,
  FiAward,
  FiTrendingUp,
  FiMapPin,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";

import { getToken, useAuth } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import { formatDate, formatINR, toISODate } from "../../utils/format";
import PartnerHeader from "./components/PartnerHeader";
import { getPartnerDashboard, acceptPartnerJob, rejectPartnerJob } from "./partnerApi";

const STAT_CARDS = [
  { key: "newRequests", label: "New Requests", icon: FiInbox, tone: "bg-sky-50 text-sky-600" },
  { key: "acceptedJobs", label: "Accepted Jobs", icon: FiCheckCircle, tone: "bg-emerald-50 text-emerald-600" },
  { key: "activeServices", label: "Active Services", icon: FiTool, tone: "bg-amber-50 text-amber-600" },
  { key: "completedJobs", label: "Completed", icon: FiAward, tone: "bg-violet-50 text-violet-600" },
];

function timeAgo(dateStr) {
  try {
    return formatDate(toISODate(new Date(dateStr)));
  } catch {
    return "";
  }
}

function PartnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

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

  const handleReject = async (id) => {
    setActioningId(id);
    try {
      await rejectPartnerJob(id);
      await load();
    } catch (err) {
      setError(err.message || "Could not decline the job");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  const firstName = (user?.fullName || "Partner").split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <PartnerHeader
        title={`Good Morning, ${firstName}!`}
        subtitle="Let's serve more homes today"
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, tone }) => (
            <div key={key} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{data?.stats?.[key] ?? 0}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Total earnings */}
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-extrabold text-emerald-600">
                {formatINR(data?.stats?.totalEarnings ?? 0)}
              </p>
              <p className="text-sm text-slate-500">Total Earnings</p>
            </div>
            <button
              onClick={() => navigate("/partner/earnings")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
              aria-label="View earnings"
            >
              <FiTrendingUp size={22} />
            </button>
          </div>
        </div>

        {/* New service requests */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">New Service Requests</h2>
            <button
              onClick={() => navigate("/partner/jobs")}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </button>
          </div>

          {data?.recentRequests?.length ? (
            <div className="space-y-4">
              {data.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-gray-100 p-4 transition hover:border-emerald-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{req.serviceName}</p>
                      <p className="mt-0.5 text-xs font-medium text-emerald-600">New Request</p>
                    </div>
                    {req.visitFee != null && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Visit Fee ₹{req.visitFee}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <FiMapPin size={14} />
                      {req.address}
                      {req.city ? `, ${req.city}` : ""}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <FiClock size={14} />
                      {timeAgo(req.bookingDate)}, {req.timeSlot}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={actioningId === req.id}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={actioningId === req.id}
                      className="flex-1 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No new requests right now. We'll notify you the moment a job comes in nearby.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default PartnerDashboard;
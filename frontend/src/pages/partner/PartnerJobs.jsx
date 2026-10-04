import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiClock, FiChevronRight, FiAlertCircle } from "react-icons/fi";

import { getToken } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import { formatINR } from "../../utils/format";
import PartnerHeader from "./components/PartnerHeader";
import { getPartnerJobs, acceptPartnerJob, rejectPartnerJob } from "./partnerApi";

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

function PartnerJobs() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("new");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(
    async (status, signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await getPartnerJobs(status, signal);
        setBookings(res.bookings || []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true, state: { from: "/partner/jobs" } });
          return;
        }
        setError(err.message || "Failed to load jobs");
      } finally {
        if (!signal?.aborted) setLoading(false);
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
    load(tab, controller.signal);
    return () => controller.abort();
  }, [tab, load, navigate]);

  const handleAccept = async (e, id) => {
    e.stopPropagation();
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

  const handleReject = async (e, id) => {
    e.stopPropagation();
    setActioningId(id);
    try {
      await rejectPartnerJob(id);
      setBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(err.message || "Could not decline the job");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <PartnerHeader title="My Jobs" />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 hover:bg-emerald-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading jobs...</p>
        ) : bookings.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b._id}
                onClick={() => navigate(`/partner/jobs/${b._id}`)}
                className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-emerald-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{b.service?.name}</p>
                    <p className="text-xs text-slate-500">#{b.bookingCode}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {STATUS_LABEL[b.status] || b.status}
                  </span>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                  <FiMapPin size={14} />
                  {b.address}
                  {b.city ? `, ${b.city}` : ""}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <FiClock size={14} />
                  {b.timeSlot}
                </p>

                {b.finalRepairAmount != null && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    {formatINR(b.finalRepairAmount)}
                  </p>
                )}

                {tab === "new" ? (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={(e) => handleAccept(e, b._id)}
                      disabled={actioningId === b._id}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => handleReject(e, b._id)}
                      disabled={actioningId === b._id}
                      className="flex-1 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-end text-sm font-semibold text-emerald-600">
                    View Details <FiChevronRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default PartnerJobs;
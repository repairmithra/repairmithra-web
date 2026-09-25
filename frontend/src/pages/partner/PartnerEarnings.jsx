import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiTrendingUp } from "react-icons/fi";

import { getToken } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import { formatINR } from "../../utils/format";
import PartnerHeader from "./components/PartnerHeader";
import { getPartnerEarnings } from "./partnerApi";

function PartnerEarnings() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (signal) => {
      try {
        const res = await getPartnerEarnings(signal);
        setData(res.data);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true, state: { from: "/partner/earnings" } });
          return;
        }
        setError(err.message || "Failed to load earnings");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!getToken()) {
      navigate("/partner/login", { replace: true, state: { from: "/partner/earnings" } });
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <PartnerHeader title="My Earnings" />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading earnings...</p>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-600 to-emerald-500 p-6 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">This Month</p>
                  <p className="mt-1 text-3xl font-extrabold">{formatINR(data?.monthEarnings ?? 0)}</p>
                  <p className="mt-0.5 text-xs text-emerald-100">Total Earnings</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                  <FiTrendingUp size={26} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-900">{data?.completedCount ?? 0}</p>
                <p className="text-xs font-medium text-slate-500">Completed Jobs</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
                <p className="text-2xl font-bold text-slate-900">{formatINR(data?.avgPerJob ?? 0)}</p>
                <p className="text-xs font-medium text-slate-500">Avg. Per Job</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-bold text-slate-900">Recent Payments</h2>

              {data?.recentPayments?.length ? (
                <div className="divide-y divide-gray-100">
                  {data.recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-slate-900">{p.serviceName}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(p.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          + {formatINR(p.amount || 0)}
                        </p>
                        <p className="text-xs text-slate-400">{p.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-slate-500">
                  No completed jobs yet. Finish your first job to see it here.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default PartnerEarnings;
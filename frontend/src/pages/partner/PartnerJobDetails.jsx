import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiPhone,
  FiMapPin,
  FiClock,
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiStar,
  FiNavigation,
  FiClipboard,
  FiPlay,
  FiFlag,
} from "react-icons/fi";

import { getToken } from "../../utils/auth";
import { isAuthError } from "../../utils/api";
import { formatDate, formatINR, toISODate } from "../../utils/format";
import PartnerHeader from "./components/PartnerHeader";
import {
  getPartnerJobById,
  acceptPartnerJob,
  rejectPartnerJob,
  updatePartnerJobStatus,
} from "./partnerApi";

const FLOW_STEPS = [
  { key: "technician_assigned", label: "Accept Job", detail: "Confirm the request", icon: FiCheck },
  { key: "technician_on_the_way", label: "Visit Customer", detail: "Go to the customer location", icon: FiNavigation },
  { key: "technician_arrived", label: "Inspect & Give Estimate", detail: "Check the issue and share cost", icon: FiClipboard },
  { key: "repair_in_progress", label: "Start Service", detail: "Begin work after customer approval", icon: FiPlay },
  { key: "completed", label: "Complete Service", detail: "Mark as completed", icon: FiFlag },
  { key: "rated", label: "Get Rating", detail: "Customer rates your service", icon: FiStar },
];

// Maps the CURRENT booking.status to how far along FLOW_STEPS we are.
// (technician_assigned itself means "Accept Job" is already done.)
const STEP_INDEX = {
  technician_assigned: 0,
  technician_on_the_way: 1,
  technician_arrived: 2,
  inspection_completed: 2,
  repair_in_progress: 3,
  completed: 4,
};

const ACTION_FOR_STATUS = {
  technician_assigned: { action: "start_travel", label: "Start Visit" },
  technician_on_the_way: { action: "arrived", label: "Mark Arrived" },
  technician_arrived: { action: "give_estimate", label: "Give Estimate & Continue", needsAmount: true },
  inspection_completed: { action: "start_service", label: "Start Service" },
  repair_in_progress: { action: "complete", label: "Complete Service" },
};

function PartnerJobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState("");

  const load = useCallback(
    async (signal) => {
      try {
        const res = await getPartnerJobById(id, signal);
        setBooking(res.booking);
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isAuthError(err)) {
          navigate("/partner/login", { replace: true });
          return;
        }
        setError(err.message || "Failed to load job");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id, navigate]
  );

  useEffect(() => {
    if (!getToken()) {
      navigate("/partner/login", { replace: true });
      return;
    }
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, navigate]);

  const handleAccept = async () => {
    setBusy(true);
    setError("");
    try {
      await acceptPartnerJob(id);
      await load();
    } catch (err) {
      setError(err.message || "Could not accept the job");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    setBusy(true);
    setError("");
    try {
      await rejectPartnerJob(id);
      navigate("/partner/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not decline the job");
      setBusy(false);
    }
  };

  const handleAdvance = async () => {
    const step = ACTION_FOR_STATUS[booking.status];
    if (!step) return;

    if (step.needsAmount) {
      const value = Number(estimate);
      if (!Number.isFinite(value) || value <= 0) {
        setError("Please enter a valid estimate amount");
        return;
      }
    }

    setBusy(true);
    setError("");
    try {
      await updatePartnerJobStatus(id, step.action, step.needsAmount ? Number(estimate) : undefined);
      await load();
    } catch (err) {
      setError(err.message || "Could not update this job");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-slate-500">Loading job details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PartnerHeader title="Job Details" />
        <div className="mx-auto max-w-2xl px-4 py-10 text-center">
          <p className="text-slate-500">{error || "Job not found"}</p>
        </div>
      </div>
    );
  }

  const isNewRequest = booking.technicianResponseStatus === "pending";
  const currentStepIndex = STEP_INDEX[booking.status] ?? 0;
  const nextAction = ACTION_FOR_STATUS[booking.status];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <PartnerHeader title={booking.service?.name} subtitle={`#${booking.bookingCode}`} />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <FiArrowLeft size={16} />
          Back
        </button>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Job info card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900">{booking.service?.name}</h1>
            {isNewRequest && (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
                New Request
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">#{booking.bookingCode}</p>

          <div className="mt-5 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer</p>
            <p className="font-semibold text-slate-900">{booking.customer?.fullName}</p>
            {booking.customer?.phone && (
              <a
                href={`tel:${booking.customer.phone}`}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600"
              >
                <FiPhone size={14} /> +91 {booking.customer.phone}
              </a>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-start gap-1.5">
              <FiMapPin size={15} className="mt-0.5 shrink-0" />
              {booking.address}
              {booking.city ? `, ${booking.city}` : ""} {booking.pincode}
            </p>
            <p className="flex items-center gap-1.5">
              <FiClock size={15} className="shrink-0" />
              {formatDate(toISODate(new Date(booking.bookingDate)))},{" "}
              {booking.timeSlot}
            </p>
          </div>

          {booking.notes && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <FiFileText size={13} /> Issue Description
              </p>
              <p className="mt-1 text-sm text-slate-700">{booking.notes}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
            <span className="text-sm font-medium text-emerald-700">Visit Fee (Paid by Customer)</span>
            <span className="font-bold text-emerald-700">
              {booking.visitFeePaid != null ? formatINR(booking.visitFeePaid) : "Pending"}
            </span>
          </div>

          {booking.finalRepairAmount != null && (
            <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">Repair Estimate / Amount</span>
              <span className="font-bold text-slate-800">{formatINR(booking.finalRepairAmount)}</span>
            </div>
          )}

          {isNewRequest && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAccept}
                disabled={busy}
                className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                Accept
              </button>
              <button
                onClick={handleReject}
                disabled={busy}
                className="flex-1 rounded-xl bg-red-50 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {/* Service flow */}
        {!isNewRequest && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-bold text-slate-900">Service Flow</h2>

            <div className="space-y-0">
              {FLOW_STEPS.map((step, index) => {
                const done = index < currentStepIndex || booking.status === "completed" && index <= 4;
                const isRatingStep = step.key === "rated";
                const current = !done && index === currentStepIndex && !isRatingStep;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          done
                            ? "bg-emerald-600 text-white"
                            : current
                            ? "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      {index < FLOW_STEPS.length - 1 && (
                        <div
                          className={`h-full w-0.5 flex-1 ${done ? "bg-emerald-500" : "bg-slate-200"}`}
                          style={{ minHeight: "1.5rem" }}
                        />
                      )}
                    </div>

                    <div className="pb-6">
                      <p
                        className={`font-semibold ${
                          done || current ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-sm text-slate-500">{step.detail}</p>

                      {isRatingStep && booking.status === "completed" && (
                        <p className="mt-1 text-sm">
                          {booking.rating?.score ? (
                            <span className="flex items-center gap-1 font-semibold text-amber-500">
                              <FiStar className="fill-amber-400" size={14} /> {booking.rating.score}/5
                            </span>
                          ) : (
                            <span className="text-slate-400">Awaiting customer rating</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {nextAction && (
              <div className="mt-2 border-t border-gray-100 pt-5">
                {nextAction.needsAmount && (
                  <div className="mb-3">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Estimated Repair Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                )}

                <button
                  onClick={handleAdvance}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy ? "Updating..." : nextAction.label}
                </button>
              </div>
            )}

            {booking.status === "completed" && (
              <div className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
                Job completed 🎉 Payment received directly from the customer.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PartnerJobDetails;
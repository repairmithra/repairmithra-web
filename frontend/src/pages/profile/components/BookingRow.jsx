import { useNavigate } from "react-router-dom";
import { FiChevronRight, FiTool } from "react-icons/fi";

import { formatINR } from "../../../utils/format";
import { formatBookingDate, statusMeta } from "../profileUtils";

function BookingRow({ booking }) {
  const navigate = useNavigate();
  const meta = statusMeta(booking.status);
  const fee = booking.payment?.amount ?? booking.service?.visitFee;

  return (
    <button
      onClick={() => navigate(`/booking/${booking._id}`)}
      className="flex w-full items-center gap-4 rounded-xl border border-gray-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <FiTool size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">
          {booking.service?.name || "Service"}
        </p>
        <p className="text-xs text-gray-500">
          {formatBookingDate(booking.bookingDate)} · {booking.timeSlot}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${meta.classes}`}
      >
        {meta.label}
      </span>

      {fee != null && (
        <span className="hidden shrink-0 text-sm font-semibold text-gray-700 sm:block">
          {formatINR(fee)}
        </span>
      )}

      <FiChevronRight className="shrink-0 text-gray-300" size={18} />
    </button>
  );
}

export default BookingRow;
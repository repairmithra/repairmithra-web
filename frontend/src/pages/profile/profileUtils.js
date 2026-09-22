// Shared helpers for the customer profile dashboard.

export const STATUS_META = {
  pending_payment: { label: "Payment Pending", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  technician_assigned: { label: "Technician Assigned", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  technician_on_the_way: { label: "On The Way", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  technician_arrived: { label: "Technician Arrived", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  inspection_completed: { label: "Inspection Done", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  repair_in_progress: { label: "In Progress", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  completed: { label: "Completed", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelled", classes: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const statusMeta = (status) =>
  STATUS_META[status] || { label: status || "Unknown", classes: "bg-gray-100 text-gray-600 border-gray-200" };

export const isUpcomingStatus = (status) =>
  !["completed", "cancelled"].includes(status);

// "Swathi Odela" -> "S"  |  "Ravi" -> "R"
export const getInitial = (name) =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

// Date (or ISO string) -> "12 Sep 2025"
export const formatFullDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Date (or ISO string) -> "Sep 2025"
export const formatMonthYear = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

// Date (or ISO string) -> "12 Sep, 10:00 AM" (time comes from the booking's
// fixed slot label since bookingDate is stored at midnight)
export const formatBookingDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
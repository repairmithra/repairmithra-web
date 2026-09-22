import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiTool,
  FiCreditCard,
  FiHeadphones,
  FiChevronRight,
  FiHome,
  FiZap,
  FiPlus,
} from "react-icons/fi";

import StatCard from "./StatCard";
import BookingRow from "./BookingRow";
import HouseShieldIllustration from "./HouseShieldIllustration";
import { formatMonthYear, getInitial, isUpcomingStatus } from "../profileUtils";

function OverviewTab({ user, bookings, onEdit, onGoToTab }) {
  const navigate = useNavigate();

  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const upcoming = bookings.filter((b) => isUpcomingStatus(b.status)).length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  const recent = bookings.slice(0, 3);
  const firstName = (user.fullName || "").trim().split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-900 text-xl font-bold text-white ring-4 ring-white">
                {getInitial(user.fullName)}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
                  {user.fullName}
                </h1>
                {user.isVerified && (
                  <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    <FiCheckCircle size={12} /> Verified Customer
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <FiMail size={15} className="shrink-0 text-gray-400" /> {user.email}
              </p>
              <p className="flex items-center gap-2">
                <FiPhone size={15} className="shrink-0 text-gray-400" /> +91 {user.phone}
              </p>
              <p className="flex items-center gap-2">
                <FiCalendar size={15} className="shrink-0 text-gray-400" />
                Member Since&nbsp;<span className="font-semibold text-gray-800">{formatMonthYear(user.createdAt)}</span>
              </p>
            </div>

            <button
              onClick={onEdit}
              className="mt-5 flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              <FiEdit2 size={14} /> Edit Profile
            </button>
          </div>

          <HouseShieldIllustration className="hidden w-48 shrink-0 sm:block lg:w-56" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button onClick={() => onGoToTab("bookings")} className="text-left">
          <StatCard icon={FiCalendar} value={total} label="Total Bookings" tone="blue" arrow />
        </button>
        <button onClick={() => onGoToTab("bookings")} className="text-left">
          <StatCard icon={FiCheckCircle} value={completed} label="Completed" tone="emerald" arrow />
        </button>
        <button onClick={() => onGoToTab("bookings")} className="text-left">
          <StatCard icon={FiClock} value={upcoming} label="Upcoming" tone="amber" arrow />
        </button>
        <button onClick={() => onGoToTab("bookings")} className="text-left">
          <StatCard icon={FiTool} value={cancelled} label="Cancelled" tone="rose" arrow />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-gray-900">
              <FiUser className="text-sky-600" /> Personal Information
            </h2>
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-sm font-semibold text-sky-600 hover:underline"
            >
              <FiEdit2 size={13} /> Edit
            </button>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-3 border-b border-gray-50 pb-3">
              <FiUser className="mt-0.5 shrink-0 text-gray-400" size={16} />
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{user.fullName}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 border-b border-gray-50 pb-3">
              <FiMail className="mt-0.5 shrink-0 text-gray-400" size={16} />
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{user.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3 border-b border-gray-50 pb-3">
              <FiPhone className="mt-0.5 shrink-0 text-gray-400" size={16} />
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">+91 {user.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiShield className="mt-0.5 shrink-0 text-gray-400" size={16} />
              <div>
                <dt className="text-gray-500">Account Type</dt>
                <dd className="mt-1">
                  {user.isVerified ? (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      <FiCheckCircle size={12} /> Verified Customer
                    </span>
                  ) : (
                    <span className="flex w-fit items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold capitalize text-gray-600">
                      {user.role}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Saved Address */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-gray-900">
              <FiMapPin className="text-sky-600" /> Saved Address
            </h2>
            <button
              onClick={onEdit}
              className="text-sm font-semibold text-sky-600 hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600">
              <FiHome size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                Home
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  Default
                </span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {user.address}, {user.pincode}
              </p>
            </div>
            <FiChevronRight className="mt-1 shrink-0 text-gray-300" size={16} />
          </div>

          <button
            onClick={onEdit}
            className="mt-3 flex w-full items-center gap-3 rounded-xl border border-dashed border-sky-200 bg-sky-50/40 p-4 text-left transition hover:bg-sky-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-500">
              <FiMapPin size={16} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-gray-800">
                Add more addresses for faster booking
              </span>
              <span className="block text-xs text-gray-500">
                Work, friends, family — save all your locations.
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-sky-600">
              <FiPlus size={14} /> Add Address
            </span>
          </button>
        </div>
      </div>

      {/* Trust bar */}
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-emerald-50/60 to-sky-50/60 p-5 sm:grid-cols-4">
        {[
          { icon: FiShield, tone: "emerald", title: "Trusted Professionals", subtitle: "Verified & skilled experts" },
          { icon: FiZap, tone: "sky", title: "Fast & Reliable", subtitle: "Quick service, on time" },
          { icon: FiShield, tone: "emerald", title: "Secure Payments", subtitle: "Multiple payment options" },
          { icon: FiHeadphones, tone: "sky", title: "24/7 Support", subtitle: "We're always here" },
        ].map(({ icon: Icon, tone, title, subtitle }) => (
          <div key={title} className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                tone === "emerald" ? "bg-emerald-100 text-emerald-600" : "bg-sky-100 text-sky-600"
              }`}
            >
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">{title}</p>
              <p className="truncate text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <FiCalendar className="text-sky-600" /> Recent Bookings
          </h2>
          {bookings.length > 0 && (
            <button
              onClick={() => onGoToTab("bookings")}
              className="text-sm font-semibold text-sky-600 hover:underline"
            >
              View All
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            You haven't booked a service yet.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((booking) => (
              <BookingRow key={booking._id} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: FiTool, label: "Book a Service", action: () => navigate("/services") },
            { icon: FiCalendar, label: "My Bookings", action: () => onGoToTab("bookings") },
            { icon: FiCreditCard, label: "Wallet & Payments", action: () => onGoToTab("wallet") },
            { icon: FiHeadphones, label: "Support", action: () => onGoToTab("support") },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 text-center transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Icon size={18} />
              </span>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
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
  FiBriefcase,
  FiTag,
  FiZap,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import StatCard from "./StatCard";
import BookingRow from "./BookingRow";
import { formatMonthYear, getInitial, isUpcomingStatus } from "../profileUtils";

const ADDRESS_ICONS = { Home: FiHome, Work: FiBriefcase };

function OverviewTab({ user, bookings, onEdit, onGoToTab, onAddAddress, onDeleteAddress }) {
  const navigate = useNavigate();

  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const upcoming = bookings.filter((b) => isUpcomingStatus(b.status)).length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  const recent = bookings.slice(0, 3);
  const firstName = (user.fullName || "").trim().split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Greeting + profile summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Greeting card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-sky-50 to-emerald-50 p-6 sm:p-8 lg:col-span-3">
          <div className="relative z-10 max-w-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Hello, {firstName}! <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Find trusted professionals for all your home repair and maintenance needs.
            </p>
          </div>

          {/* Decorative icon cluster */}
          <div className="pointer-events-none absolute -right-4 -top-4 flex items-center opacity-90 sm:right-4 sm:top-6">
            <FiHome size={96} className="text-sky-200" />
            <span className="-ml-8 mt-8 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <FiCheckCircle size={20} />
            </span>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-10 rounded-full bg-white/70 p-2 text-sky-500 shadow-sm">
            <FiTool size={20} />
          </div>
        </div>

        {/* Profile summary card */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-sky-900 p-6 text-white lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-sky-800 ring-2 ring-white/30">
                {getInitial(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.fullName}</p>
                {user.isVerified && (
                  <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                    <FiCheckCircle size={11} /> Verified Customer
                  </span>
                )}
              </div>
            </div>

            <span className="shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-center text-[11px] leading-tight text-sky-100">
              Member Since
              <br />
              <span className="text-xs font-semibold text-white">
                {formatMonthYear(user.createdAt)}
              </span>
            </span>
          </div>

          <div className="mt-4 space-y-1.5 text-sm text-sky-100">
            <p className="flex items-center gap-2 truncate">
              <FiMail size={14} className="shrink-0" /> {user.email}
            </p>
            <p className="flex items-center gap-2">
              <FiPhone size={14} className="shrink-0" /> +91 {user.phone}
            </p>
          </div>

          <button
            onClick={onEdit}
            className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
          >
            <FiEdit2 size={14} /> Edit Profile
          </button>
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

          {(user.addresses || []).map((addr) => {
            const Icon = ADDRESS_ICONS[addr.label] || FiTag;
            return (
              <div
                key={addr._id}
                className="mt-3 flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sky-600">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{addr.label}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {addr.address}, {addr.pincode}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteAddress(addr._id)}
                  aria-label={`Remove ${addr.label} address`}
                  title="Remove address"
                  className="mt-1 shrink-0 rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            );
          })}

          <button
            onClick={onAddAddress}
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
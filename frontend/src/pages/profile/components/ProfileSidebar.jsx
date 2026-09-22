import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiCreditCard,
  FiStar,
  FiHeadphones,
  FiBell,
  FiLogOut,
  FiMessageSquare,
} from "react-icons/fi";

import { SUPPORT } from "../../../config/site";
import { clearSession } from "../../../utils/auth";

const NAV_ITEMS = [
  { key: "overview", label: "Dashboard", icon: FiHome },
  { key: "bookings", label: "My Bookings", icon: FiCalendar },
  { key: "wallet", label: "My Wallet", icon: FiCreditCard },
  { key: "reviews", label: "Reviews & Ratings", icon: FiStar },
  { key: "messages", label: "Messages", icon: FiMessageSquare },
  { key: "support", label: "Support", icon: FiHeadphones },
  { key: "notifications", label: "Notifications", icon: FiBell },
];

function ProfileSidebar({ active, onSelect, messagesCount = 0 }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Nav list */}
      <nav className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <ul className="flex gap-1 overflow-x-auto lg:block lg:overflow-visible lg:space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            const badge = key === "messages" ? messagesCount : 0;
            return (
              <li key={key} className="shrink-0 lg:shrink">
                <button
                  onClick={() => onSelect(key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-sky-50 text-sky-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-sky-600" : "text-gray-400"} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[11px] font-semibold text-white">
                      {badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Need help card */}
      <div className="mt-4 hidden lg:block rounded-2xl bg-gradient-to-br from-sky-600 to-sky-700 p-5 text-white shadow-sm">
        <p className="font-semibold">Need Help?</p>
        <p className="mt-1 text-sm text-sky-100">
          Our support team is here for you 24/7.
        </p>
        <a
          href={SUPPORT.phoneHref}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
        >
          Contact Support
        </a>
      </div>

      {/* Logout — last item in the profile details */}
      <button
        onClick={handleLogout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        <FiLogOut size={18} />
        Logout
      </button>
    </aside>
  );
}

export default ProfileSidebar;
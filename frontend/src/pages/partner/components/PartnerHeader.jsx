import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiMenu,
  FiX,
  FiGrid,
  FiDollarSign,
  FiUser,
  FiTrendingUp,
  FiLogOut,
  FiClock,
} from "react-icons/fi";

import logo from "../../../assets/images/repairmithra-logo.png";
import { clearSession, useAuth } from "../../../utils/auth";
import { getPartnerDashboard } from "../partnerApi";

const NAV_LINKS = [
  { to: "/partner/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/partner/earnings", label: "Earnings", icon: FiDollarSign },
  { to: "/partner/profile", label: "Profile", icon: FiUser },
  { to: "/partner/grow", label: "Grow with Us", icon: FiTrendingUp },
];

// How often to check for new job requests while a partner page is open.
const POLL_INTERVAL_MS = 30_000;

function PartnerHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [newRequests, setNewRequests] = useState([]);
  const notifRef = useRef(null);

  // Pull the same "pending job requests" data the dashboard cards use, so
  // the bell reflects reality instead of sitting there decoratively.
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        const res = await getPartnerDashboard(controller.signal);
        if (!cancelled && res?.success) {
          setNewRequests(res.data?.recentRequests || []);
        }
      } catch {
        // Silent: a failed poll shouldn't disrupt whatever page is open.
        // The dashboard page itself will surface a real error if the
        // partner is actually logged out or the server is unreachable.
      }
    };

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  // Close the notification dropdown on an outside click.
  useEffect(() => {
    if (!notifOpen) return undefined;

    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const unreadCount = newRequests.length;

  const handleLogout = () => {
    clearSession();
    navigate("/partner/login", { replace: true });
  };

  const goToJob = (id) => {
    setNotifOpen(false);
    navigate(`/partner/jobs/${id}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => navigate("/partner/dashboard")}
            className="flex shrink-0 items-center gap-2"
          >
            <img src={logo} alt="RepairMithra" className="h-12 w-auto object-contain" />
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:inline">
              Partner
            </span>
          </button>

          {(title || subtitle) && (
            <div className="hidden min-w-0 flex-1 px-6 text-center sm:block">
              {title && <p className="truncate text-base font-bold text-slate-900">{title}</p>}
              {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} new` : ""}`}
                aria-expanded={notifOpen}
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      New job requests
                    </p>
                  </div>

                  {unreadCount === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">
                      No new requests right now.
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto">
                      {newRequests.map((job) => (
                        <li key={job.id}>
                          <button
                            onClick={() => goToJob(job.id)}
                            className="flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
                          >
                            <span className="text-sm font-medium text-slate-900">
                              {job.serviceName} — {job.customerName}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <FiClock size={12} />
                              {job.bookingDate
                                ? new Date(job.bookingDate).toLocaleDateString()
                                : ""}{" "}
                              {job.timeSlot ? `· ${job.timeSlot}` : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/partner/dashboard");
                    }}
                    className="block w-full border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    View dashboard
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-emerald-50"
              aria-label="Open partner menu"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
                {(user?.fullName || "P").trim().charAt(0).toUpperCase()}
              </span>
              <FiMenu size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {(title || subtitle) && (
          <div className="border-t border-emerald-50 px-4 py-3 text-center sm:hidden">
            {title && <p className="text-base font-bold text-slate-900">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        )}
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-screen w-72 overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <p className="font-bold text-slate-900">{user?.fullName || "Partner"}</p>
                <p className="text-xs text-slate-500">{user?.phone || user?.email}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <FiX size={24} />
              </button>
            </div>

            <nav className="space-y-1 p-4">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(to);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-red-600 transition hover:bg-red-50"
              >
                <FiLogOut size={18} />
                Log Out
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

export default PartnerHeader;
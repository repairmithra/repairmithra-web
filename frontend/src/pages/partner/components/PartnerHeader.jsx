import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiMenu,
  FiX,
  FiHome,
  FiInbox,
  FiCalendar,
  FiUser,
  FiTrendingUp,
  FiSettings,
  FiLogOut,
  FiClock,
  FiPhone,
  FiHeadphones,
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
} from "react-icons/fi";
import { LuIndianRupee } from "react-icons/lu";

import logo from "../../../assets/images/repairmithra-logo.png";
import { clearSession, useAuth } from "../../../utils/auth";
import { getPartnerDashboard } from "../partnerApi";

const NAV_LINKS = [
  { to: "/partner/dashboard", label: "Dashboard", icon: FiHome },
  { to: "/partner/jobs?tab=new", label: "Service Requests", icon: FiInbox },
  { to: "/partner/jobs?tab=accepted", label: "My Jobs", icon: FiCalendar },
  { to: "/partner/earnings", label: "Earnings", icon: LuIndianRupee },
  { to: "/partner/profile", label: "Profile", icon: FiUser },
  { to: "/partner/grow", label: "Grow with Us", icon: FiTrendingUp },
  { to: "/partner/profile", label: "Settings", icon: FiSettings },
];

const SUPPORT_URL = "mailto:support@repairmithra.com";

// How often to check for new job requests while a partner page is open.
const POLL_INTERVAL_MS = 30_000;

function PartnerHeader({ title, subtitle, icon: TitleIcon, variant = "menu" }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center px-4 sm:h-24 sm:px-6">
          <button
            onClick={() => navigate("/partner/dashboard")}
            className="flex min-w-0 shrink items-center gap-2 sm:gap-3"
          >
            <img src={logo} alt="RepairMithra" className="h-11 w-auto min-w-0 object-contain sm:h-[4.25rem]" />
            <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 min-[420px]:inline">
              Partner
            </span>
          </button>

          {(title || subtitle) && (
            <div className="ml-6 hidden min-w-0 flex-1 items-center gap-3 border-l border-gray-200 pl-6 md:flex">
              {TitleIcon && <TitleIcon size={26} className="shrink-0 text-slate-800" />}
              <div className="min-w-0">
                {title && <p className="truncate text-lg font-bold text-slate-900">{title}</p>}
                {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} new` : ""}`}
                aria-expanded={notifOpen}
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-800 transition hover:bg-emerald-50"
              >
                <FiBell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">New job requests</p>
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
                      navigate("/partner/jobs?tab=new");
                    }}
                    className="block w-full border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    View all requests
                  </button>
                </div>
              )}
            </div>

            {variant === "avatar" ? (
              <button
                onClick={() => setMenuOpen(true)}
                className="flex items-center gap-1.5 sm:ml-1 sm:gap-3 sm:border-l sm:border-gray-200 sm:pl-5"
                aria-label="Open partner menu"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-base font-semibold text-white sm:h-12 sm:w-12 sm:text-lg">
                  {(user?.fullName || "P").trim().charAt(0).toUpperCase()}
                </span>
                <FiChevronDown size={18} className="text-slate-800" />
              </button>
            ) : (
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.12)] transition hover:bg-emerald-50"
                aria-label="Open partner menu"
              >
                <FiMenu size={22} />
              </button>
            )}
          </div>
        </div>

        {(title || subtitle) && (
          <div className="px-4 pb-3 pt-1 md:hidden">
            {title && <p className="text-lg font-bold text-slate-900">{title}</p>}
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        )}
      </header>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/30"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-screen w-[22rem] max-w-full flex-col overflow-y-auto bg-white px-6 pb-6 pt-5 shadow-2xl">
            <div className="flex justify-end">
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-1.5 text-slate-800 transition hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="mt-1 flex items-center gap-4 border-b border-gray-100 pb-6">
              <div className="relative">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-semibold text-white">
                  {(user?.fullName || "P").trim().charAt(0).toUpperCase()}
                </span>
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-slate-900">
                  {user?.fullName || "Partner"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <FiCheckCircle size={12} />
                  Verified Partner
                </span>
                {(user?.phone || user?.email) && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
                    {user?.phone && <FiPhone size={14} className="text-emerald-600" />}
                    <span className="truncate">{user?.phone || user?.email}</span>
                  </p>
                )}
              </div>
            </div>

            <nav className="mt-4 space-y-1 border-b border-gray-100 pb-4">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const active = label === "Dashboard" && pathname === "/partner/dashboard";
                return (
                  <button
                    key={label}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(to);
                    }}
                    className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition ${
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-800 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-emerald-600" : "text-slate-600"} />
                    {label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-red-600 transition hover:bg-red-50"
            >
              <FiLogOut size={20} />
              Log Out
            </button>

            <div className="mt-auto pt-8">
              <div className="rounded-2xl bg-emerald-50/60 p-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <FiHeadphones size={24} />
                  </span>
                  <div>
                    <p className="font-bold text-emerald-700">Need Help?</p>
                    <p className="text-sm text-slate-600">We're here to support you</p>
                  </div>
                </div>
                <a
                  href={SUPPORT_URL}
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Contact Support
                  <FiArrowRight size={16} />
                </a>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

export default PartnerHeader;
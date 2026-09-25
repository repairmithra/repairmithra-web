import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiUser,
  FiBriefcase,
  FiBell,
  FiChevronDown,
} from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";

import TopBar from "./TopBar";
import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import LocationSelector from "./LocationSelector";
import { useAuth, isTechnician } from "../../utils/auth";

function Navbar() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  // Updates automatically when the user logs in or out
  const { isLoggedIn, user } = useAuth();
  const initial = (user?.fullName || "?").trim().charAt(0).toUpperCase();
  const partner = isTechnician(user);
  const accountPath = partner ? "/partner/dashboard" : "/profile";

  return (
    <>
      <TopBar location={selectedLocation} />

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto flex h-24 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <div
            className="flex shrink-0 items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src={logo}
              alt="RepairMithra"
              className="h-16 md:h-20 lg:h-24 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Search Bar */}
          <SearchBar className="hidden md:flex flex-1 max-w-md" />

          {/* Location Selector */}
          <LocationSelector
            className="hidden lg:block w-52 shrink-0"
            selected={selectedLocation}
            onSelect={setSelectedLocation}
          />

          {/* Desktop Navigation */}
          <DesktopMenu />

          {/* Auth / Action Buttons */}
          <div className="hidden lg:flex shrink-0 items-center gap-3">

            {/* BEFORE LOGIN */}
            {!isLoggedIn && (
              <>
                {/* Join as Partner */}
                <button
                  onClick={() => navigate("/partner/register")}
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border-2
                    border-emerald-600
                    px-5
                    py-3
                    text-emerald-600
                    font-semibold
                    transition-all
                    duration-300
                    hover:bg-emerald-50
                    hover:-translate-y-0.5
                  "
                >
                  <FiBriefcase size={18} />
                  Join as Partner
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-sky-600
                    px-6
                    py-3
                    text-white
                    font-semibold
                    shadow-md
                    transition-all
                    duration-300
                    hover:bg-sky-700
                    hover:-translate-y-0.5
                  "
                >
                  <FiUser size={18} />
                  Login
                </button>
              </>
            )}

            {/* AFTER LOGIN */}
            {isLoggedIn && (
              <>
                {/* Notifications */}
                <button
                  onClick={() => navigate(accountPath)}
                  aria-label="Notifications"
                  title="Notifications"
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-gray-100 ${
                    partner ? "hover:text-emerald-600" : "hover:text-sky-600"
                  }`}
                >
                  <FiBell size={20} />
                </button>

                {/* Profile chip — avatar + name, links to /profile (or the
                    partner dashboard for a technician account). Logout lives
                    inside that page, not here. */}
                <button
                  onClick={() => navigate(accountPath)}
                  aria-label="Go to account"
                  title="Account"
                  className="flex shrink-0 items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-gray-100"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-white ${
                      partner ? "bg-emerald-600" : "bg-sky-600"
                    }`}
                  >
                    {initial}
                  </span>
                  <span className="hidden text-left lg:block">
                    <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight text-slate-900">
                      {user?.fullName || "My Account"}
                    </span>
                    <span className={`block text-xs font-medium leading-tight ${partner ? "text-emerald-600" : "text-sky-600"}`}>
                      {partner ? "RepairMithra Partner" : user?.isVerified ? "Verified Customer" : "Customer"}
                    </span>
                  </span>
                  <FiChevronDown size={16} className="hidden text-slate-400 xl:block" />
                </button>
              </>
            )}

          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden ml-auto shrink-0 rounded-lg p-2 hover:bg-gray-100 transition"
            aria-label="Open menu"
          >
            <FiMenu size={28} />
          </button>

        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        setOpen={setMobileOpen}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
      />
    </>
  );
}

export default Navbar;
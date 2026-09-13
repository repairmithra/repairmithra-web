import { useState } from "react";
import { FiMenu, FiUser, FiBriefcase, FiCalendar } from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";

import TopBar from "./TopBar";
import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import LocationSelector from "./LocationSelector";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <TopBar />

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <img
              src={logo}
              alt="RepairMithra"
              className="h-14 md:h-16 lg:h-[70px] w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Search Bar */}
          <SearchBar className="hidden md:flex flex-1 max-w-md" />

          {/* Location Selector */}
          <LocationSelector className="hidden lg:block w-52 shrink-0" />

          {/* Desktop Navigation */}
          <DesktopMenu />

          {/* Auth / Action Buttons */}
          <div className="hidden lg:flex shrink-0 items-center gap-3">

            <button
              className="
                flex
                items-center
                gap-2
                rounded-xl
                border-2
                border-blue-600
                px-5
                py-3
                text-blue-600
                font-semibold
                transition-all
                duration-300
                hover:bg-blue-50
                hover:-translate-y-0.5
              "
            >
              <FiBriefcase size={18} />
              Join as Partner
            </button>

            <button
              className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-blue-600
                px-6
                py-3
                text-white
                font-semibold
                shadow-md
                transition-all
                duration-300
                hover:bg-blue-700
                hover:-translate-y-0.5
              "
            >
              <FiUser size={18} />
              Login
            </button>

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
      />
    </>
  );
}

export default Navbar;
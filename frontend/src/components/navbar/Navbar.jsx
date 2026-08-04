import { useState } from "react";
import { FiMenu } from "react-icons/fi";

import logo from "../../assets/images/repairmithra-logo.png";

import TopBar from "./TopBar";
import DesktopMenu from "./DesktopMenu";
import MobileMenu from "./MobileMenu";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <TopBar />

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <div className="flex items-center">
            <img
              src={logo}
              alt="RepairMithra"
              className="h-14 md:h-16 lg:h-[70px] w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Desktop Navigation */}
          <DesktopMenu />

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-3">

            <button
              className="
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
              Book A Service
            </button>

            <button
            
              className="
                rounded-xl
                bg-slate-900
                px-6
                py-3
                text-white
                font-semibold
                shadow-md
                transition-all
                duration-300
                hover:bg-slate-800
                 hover:-translate-y-0.5
              "
            >
              Join as Pro
            </button>

          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden rounded-lg p-2 hover:bg-gray-100 transition"
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
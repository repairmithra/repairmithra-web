import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiUser,
  FiBriefcase,
  FiCalendar,
} from "react-icons/fi";

import SearchBar from "./SearchBar";
import LocationSelector, { LOCATIONS } from "./LocationSelector";
import { useAuth, isTechnician } from "../../utils/auth";

function MobileMenu({ open, setOpen, selectedLocation, setSelectedLocation }) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const partner = isTechnician(user);
  const [locationOpen, setLocationOpen] = useState(false);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b">

          <h2 className="text-xl font-bold">
            Menu
          </h2>

          <button onClick={() => setOpen(false)}>
            <FiX size={28} />
          </button>

        </div>

        <div className="p-6 space-y-2">

          {/* Search Bar */}
          <SearchBar className="mb-3 w-full" onSearch={() => setOpen(false)} />

          {/* Location Selector */}
          <LocationSelector
            className="mb-4 w-full"
            selected={selectedLocation}
            onSelect={setSelectedLocation}
          />

          <button
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
            className="block w-full text-left py-3 font-medium"
          >
            Home
          </button>

          {/* Services */}

          <button
            onClick={() => {
              setOpen(false);
              navigate("/services");
            }}
            className="block w-full text-left py-3 font-medium"
          >
            Services
          </button>

          {/* Locations */}

          <button
            onClick={() => setLocationOpen(!locationOpen)}
            className="flex justify-between w-full py-3 font-medium"
          >
            Locations

            {locationOpen ? (
              <FiChevronUp />
            ) : (
              <FiChevronDown />
            )}
          </button>

          {locationOpen && (

            <div className="pl-5 pb-3 space-y-3">

              {LOCATIONS.map((city) => (

                <button
                  key={city}
                  onClick={() => {
                    setSelectedLocation(city);
                    setLocationOpen(false);
                  }}
                  className={`flex items-center gap-3 ${
                    selectedLocation === city ? "font-semibold text-sky-600" : ""
                  }`}
                >
                  <FiMapPin />

                  {city}

                </button>

              ))}

            </div>

          )}


          <div className="pt-6 space-y-3">

            <button
              onClick={() => {
                setOpen(false);
                navigate("/services");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 py-3 text-slate-900 font-semibold hover:bg-slate-50 transition">
              <FiCalendar size={18} />
              Book a Service
            </button>

            {isLoggedIn ? (
              /* Logout lives inside the Profile page, not here. */
              <button
                onClick={() => {
                  setOpen(false);
                  navigate(partner ? "/partner/dashboard" : "/profile");
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-white font-semibold transition ${
                  partner ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-600 hover:bg-sky-700"
                }`}
              >
                <FiUser size={18} />
                {partner ? "Partner Dashboard" : "Profile"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/partner/register");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 py-3 text-emerald-600 font-semibold hover:bg-emerald-50 transition"
                >
                  <FiBriefcase size={18} />
                  Join as Partner
                </button>

                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/login");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-white font-semibold hover:bg-sky-700 transition"
                >
                  <FiUser size={18} />
                  Login
                </button>
              </>
            )}

          </div>

        </div>

      </div>
    </>
  );
}

export default MobileMenu;
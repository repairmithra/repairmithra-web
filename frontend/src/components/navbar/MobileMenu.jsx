import { useState } from "react";
import {
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiSmartphone,
  FiMonitor,
  FiWind,
  FiTool,
  FiZap,
  FiMapPin,
  FiUser,
  FiBriefcase,
  FiCalendar,
} from "react-icons/fi";

import SearchBar from "./SearchBar";
import LocationSelector from "./LocationSelector";

function MobileMenu({ open, setOpen }) {
  const [serviceOpen, setServiceOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  if (!open) return null;

  const services = [
    {
      icon: <FiSmartphone />,
      title: "Mobile Repair",
    },
    {
      icon: <FiMonitor />,
      title: "Laptop Repair",
    },
    {
      icon: <FiWind />,
      title: "AC Repair",
    },
    {
      icon: <FiTool />,
      title: "Plumbing",
    },
    {
      icon: <FiZap />,
      title: "Electrical",
    },
  ];

  const locations = [
    "Hyderabad",
    "Warangal",
    "Jangaon",
    "Karimnagar",
  ];

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
          <SearchBar className="mb-3 w-full" />

          {/* Location Selector */}
          <LocationSelector className="mb-4 w-full" />

          <button className="block w-full text-left py-3 font-medium">
            Home
          </button>

          {/* Services */}

          <button
            onClick={() => setServiceOpen(!serviceOpen)}
            className="flex justify-between w-full py-3 font-medium"
          >
            Services

            {serviceOpen ? (
              <FiChevronUp />
            ) : (
              <FiChevronDown />
            )}
          </button>

          {serviceOpen && (

            <div className="pl-5 pb-3 space-y-3">

              {services.map((service) => (

                <button
                  key={service.title}
                  className="flex items-center gap-3"
                >
                  {service.icon}

                  {service.title}

                </button>

              ))}

            </div>

          )}

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

              {locations.map((city) => (

                <button
                  key={city}
                  className="flex items-center gap-3"
                >
                  <FiMapPin />

                  {city}

                </button>

              ))}

            </div>

          )}

          <button className="block w-full text-left py-3 font-medium">
            Contact
          </button>

        </div>

      </div>
    </>
  );
}

export default MobileMenu;
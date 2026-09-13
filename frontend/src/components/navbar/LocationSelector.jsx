import { useState } from "react";
import { FiMapPin, FiChevronDown } from "react-icons/fi";

const locations = ["Hyderabad, Telangana", "Warangal", "Jangaon", "Karimnagar"];

function LocationSelector({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(locations[0]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:bg-white"
      >
        <FiMapPin className="shrink-0 text-lg text-blue-600" />
        <span className="truncate">{selected}</span>
        <FiChevronDown
          className={`ml-auto shrink-0 text-sm text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute top-full left-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            {locations.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setSelected(city);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 p-3 text-left text-sm transition hover:bg-blue-50 ${
                  selected === city ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700"
                }`}
              >
                <FiMapPin className="text-blue-600" />
                {city}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LocationSelector;

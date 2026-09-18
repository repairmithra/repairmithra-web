import { useState, useRef, useEffect } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";

// Comprehensive suggestion list — all Telangana districts (primary service
// area) plus every major Indian city / state capital. The user can still
// type and use ANY location beyond this list too (see "Use '...'" option).
export const LOCATIONS = [
  // Telangana — all 33 districts
  "Adilabad, Telangana",
  "Bhadradri Kothagudem, Telangana",
  "Hyderabad, Telangana",
  "Jagtial, Telangana",
  "Jangaon, Telangana",
  "Jayashankar Bhupalpally, Telangana",
  "Jogulamba Gadwal, Telangana",
  "Kamareddy, Telangana",
  "Karimnagar, Telangana",
  "Khammam, Telangana",
  "Komaram Bheem Asifabad, Telangana",
  "Mahabubabad, Telangana",
  "Mahabubnagar, Telangana",
  "Mancherial, Telangana",
  "Medak, Telangana",
  "Medchal-Malkajgiri, Telangana",
  "Mulugu, Telangana",
  "Nagarkurnool, Telangana",
  "Nalgonda, Telangana",
  "Narayanpet, Telangana",
  "Nirmal, Telangana",
  "Nizamabad, Telangana",
  "Peddapalli, Telangana",
  "Rajanna Sircilla, Telangana",
  "Ranga Reddy, Telangana",
  "Sangareddy, Telangana",
  "Siddipet, Telangana",
  "Suryapet, Telangana",
  "Vikarabad, Telangana",
  "Wanaparthy, Telangana",
  "Warangal, Telangana",
  "Hanumakonda, Telangana",
  "Yadadri Bhuvanagiri, Telangana",
  "Secunderabad, Telangana",

  // Andhra Pradesh
  "Visakhapatnam, Andhra Pradesh",
  "Vijayawada, Andhra Pradesh",
  "Guntur, Andhra Pradesh",
  "Tirupati, Andhra Pradesh",
  "Nellore, Andhra Pradesh",
  "Kurnool, Andhra Pradesh",
  "Amaravati, Andhra Pradesh",

  // Other major Indian cities / state capitals
  "Delhi",
  "Mumbai, Maharashtra",
  "Pune, Maharashtra",
  "Nagpur, Maharashtra",
  "Bengaluru, Karnataka",
  "Mysuru, Karnataka",
  "Chennai, Tamil Nadu",
  "Coimbatore, Tamil Nadu",
  "Madurai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Ahmedabad, Gujarat",
  "Surat, Gujarat",
  "Vadodara, Gujarat",
  "Jaipur, Rajasthan",
  "Udaipur, Rajasthan",
  "Lucknow, Uttar Pradesh",
  "Kanpur, Uttar Pradesh",
  "Noida, Uttar Pradesh",
  "Gurugram, Haryana",
  "Chandigarh",
  "Bhopal, Madhya Pradesh",
  "Indore, Madhya Pradesh",
  "Patna, Bihar",
  "Ranchi, Jharkhand",
  "Bhubaneswar, Odisha",
  "Raipur, Chhattisgarh",
  "Guwahati, Assam",
  "Thiruvananthapuram, Kerala",
  "Kochi, Kerala",
  "Kozhikode, Kerala",
  "Panaji, Goa",
  "Dehradun, Uttarakhand",
  "Shimla, Himachal Pradesh",
  "Srinagar, Jammu & Kashmir",
  "Jammu, Jammu & Kashmir",
];

function LocationSelector({ className = "", selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Keep the input showing the confirmed selection whenever it's not being edited
  useEffect(() => {
    if (!open) setQuery(selected || "");
  }, [selected, open]);

  const filtered =
    query.trim() === ""
      ? LOCATIONS
      : LOCATIONS.filter((city) =>
          city.toLowerCase().includes(query.trim().toLowerCase())
        );

  const commitSelection = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    setQuery(trimmed);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    commitSelection(query);
  };

  return (
    <div className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
      >
        <FiMapPin className="shrink-0 text-lg text-blue-600" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search any location..."
          className="w-full min-w-0 bg-transparent text-sm text-slate-700 placeholder:text-gray-400 focus:outline-none"
        />

        <FiSearch className="shrink-0 text-sm text-gray-400" />
      </form>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute top-full left-0 z-50 mt-2 max-h-72 w-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl">
            {filtered.length > 0 ? (
              filtered.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => commitSelection(city)}
                  className={`flex w-full items-center gap-3 p-3 text-left text-sm transition hover:bg-blue-50 ${
                    selected === city ? "bg-blue-50 font-semibold text-blue-600" : "text-slate-700"
                  }`}
                >
                  <FiMapPin className="shrink-0 text-blue-600" />
                  <span className="truncate">{city}</span>
                </button>
              ))
            ) : null}

            {/* Always let them use exactly what they typed, even if it's not in the list */}
            {query.trim() !== "" && !LOCATIONS.some(
              (c) => c.toLowerCase() === query.trim().toLowerCase()
            ) && (
              <button
                type="button"
                onClick={() => commitSelection(query)}
                className="flex w-full items-center gap-3 border-t border-gray-100 p-3 text-left text-sm text-slate-700 transition hover:bg-blue-50"
              >
                <FiSearch className="shrink-0 text-blue-600" />
                <span className="truncate">
                  Use "<span className="font-semibold">{query.trim()}</span>"
                </span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LocationSelector;
import { useEffect, useState } from "react";
import { FiLoader, FiMapPin, FiSearch } from "react-icons/fi";

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";

/*
 * Keep this export because MobileMenu.jsx may import LOCATIONS.
 * These are only fallback/popular locations.
 *
 * The actual search is dynamic and does NOT depend on this list.
 */
export const LOCATIONS = [
  "Hyderabad, Telangana",
  "Jangaon, Telangana",
  "Gurugram, Haryana",
  "Delhi",
  "Bengaluru, Karnataka",
];
function LocationSelector({ value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /*
   * Keep the input synchronized if the selected location
   * changes from outside this component.
   */
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  /*
   * Dynamic location search
   */
  useEffect(() => {
    if (!open || query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          q: `${query.trim()}, India`,
          format: "jsonv2",
          addressdetails: "1",
          limit: "25",
          countrycodes: "in",
          "accept-language": "en",
        });

        const response = await fetch(
          `${NOMINATIM_API}?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Location search failed: ${response.status}`
          );
        }

        const data = await response.json();

        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Location search error:", error);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  /*
   * Select a location from search results
   */
  const selectLocation = (location) => {
    const address = location.address || {};

    const locality =
      address.neighbourhood ||
      address.suburb ||
      address.quarter ||
      address.village ||
      address.town ||
      address.city_district ||
      address.city ||
      "";

    const district =
      address.state_district ||
      address.district ||
      "";

    const city =
      address.city ||
      address.town ||
      address.village ||
      "";

    const state = address.state || "";

    const postcode = address.postcode || "";

    /*
     * Build a clean selected location.
     */
    const parts = [
      locality,
      city !== locality ? city : "",
      district,
      state,
      postcode,
    ].filter(Boolean);

    const finalLocation =
      parts.length > 0
        ? [...new Set(parts)].join(", ")
        : location.display_name;

    setQuery(finalLocation);

    if (onChange) {
      onChange(finalLocation);
    }

    setOpen(false);
    setResults([]);
  };

  /*
   * Allow customer to manually use entered text
   * if no result is found.
   */
  const useManualLocation = () => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    if (onChange) {
      onChange(trimmed);
    }

    setOpen(false);
    setResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Location button */}
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300"
      >
        <FiMapPin className="shrink-0 text-slate-500" />

        <span className="truncate text-sm text-slate-700">
          {value || "Select your location"}
        </span>
      </button>

      {/* Search dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <FiSearch className="shrink-0 text-slate-400" />

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search area, village, city, sector or PIN..."
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />

            {loading && (
              <FiLoader className="shrink-0 animate-spin text-slate-400" />
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {results.length > 0 ? (
              results.map((location) => {
                const address = location.address || {};

                const locality =
                  address.neighbourhood ||
                  address.suburb ||
                  address.quarter ||
                  address.village ||
                  address.town ||
                  address.city_district ||
                  address.city ||
                  location.name ||
                  "";

                const city =
                  address.city ||
                  address.town ||
                  address.village ||
                  "";

                const district =
                  address.state_district ||
                  address.district ||
                  "";

                const state = address.state || "";

                const postcode = address.postcode || "";

                const secondaryText = [
                  city,
                  district,
                  state,
                  postcode,
                ]
                  .filter(Boolean)
                  .filter(
                    (item, index, array) =>
                      array.indexOf(item) === index
                  )
                  .join(", ");

                return (
                  <button
                    key={`${location.place_id}-${location.osm_id}`}
                    type="button"
                    onClick={() => selectLocation(location)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <FiMapPin className="mt-1 shrink-0 text-blue-500" />

                    <div className="min-w-0 flex-1">
                      {/* Main location */}
                      <p className="text-sm font-medium text-slate-800">
                        {locality || location.display_name}
                      </p>

                      {/* City / District / State / PIN */}
                      {secondaryText && (
                        <p className="mt-1 text-xs text-slate-500">
                          {secondaryText}
                        </p>
                      )}

                      {/* Full address */}
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {location.display_name}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : query.trim().length >= 3 && !loading ? (
              /* No results */
              <div className="px-4 py-5">
                <p className="text-sm text-slate-500">
                  No matching location found.
                </p>

                <button
                  type="button"
                  onClick={useManualLocation}
                  className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  Use "{query.trim()}"
                </button>
              </div>
            ) : (
              /* Initial state */
              <div className="px-4 py-5">
                <p className="text-sm text-slate-500">
                  Search for a location in India.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try a city, village, sector, colony, area or PIN
                  code.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
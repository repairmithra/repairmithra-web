import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { useServices } from "../../hooks/useServices";

function SearchBar({ className = "", onSearch }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { services = [] } = useServices();

  /*
   * Filter services based on what the customer types.
   */
  const suggestions =
    query.trim().length >= 2
      ? services
          .filter((service) => {
            const searchText = [
              service.title,
              service.name,
              service.description,
              service.slug,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchText.includes(query.trim().toLowerCase());
          })
          .slice(0, 6)
      : [];

  /*
   * Close suggestions when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * Normal search submit.
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmed = query.trim();

    setShowSuggestions(false);

    navigate(
      trimmed
        ? `/services?q=${encodeURIComponent(trimmed)}`
        : "/services"
    );

    onSearch?.();
  };

  /*
   * Select a service suggestion.
   */
  const handleSelectService = (service) => {
    setShowSuggestions(false);

    setQuery(service.title || service.name || "");

    if (service.slug) {
      navigate(`/services/${service.slug}`);
    } else {
      const searchValue =
        service.title || service.name || "";

      navigate(
        `/services?q=${encodeURIComponent(searchValue)}`
      );
    }

    onSearch?.();
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
      >
        <FiSearch className="shrink-0 text-lg text-gray-400" />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Search for services, e.g. AC repair, plumbing..."
          aria-label="Search for services"
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-gray-400 focus:outline-none"
        />
      </form>

      {/* Suggestions */}
      {showSuggestions && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((service) => (
                <button
                  key={service.slug || service._id || service.id}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FiSearch size={17} />
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {service.title || service.name}
                    </span>

                    {service.description && (
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {service.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4">
              <p className="text-sm text-slate-500">
                No matching service found.
              </p>

              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Search all services for "{query.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
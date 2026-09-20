import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

function SearchBar({ className = "", onSearch }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // The services page reads ?q= and filters its list
    const trimmed = query.trim();
    navigate(trimmed ? `/services?q=${encodeURIComponent(trimmed)}` : "/services");
    onSearch?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 ${className}`}
    >
      <FiSearch className="shrink-0 text-lg text-gray-400" />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for services, e.g. AC repair, plumbing..."
        aria-label="Search for services"
        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-gray-400 focus:outline-none"
      />
    </form>
  );
}

export default SearchBar;
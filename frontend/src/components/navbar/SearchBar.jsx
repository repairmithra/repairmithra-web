import { useState } from "react";
import { FiSearch } from "react-icons/fi";

function SearchBar({ className = "" }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire this up to actual search/navigation logic
    console.log("Searching for:", query);
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
        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-gray-400 focus:outline-none"
      />
    </form>
  );
}

export default SearchBar;

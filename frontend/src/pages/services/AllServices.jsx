import { Link, useSearchParams } from "react-router-dom";
import {
  LuSearch,
  LuShieldCheck,
  LuFileText,
  LuClock,
  LuHeadset,
} from "react-icons/lu";

import { searchServices } from "../../data/servicesData";
import { formatINR } from "../../utils/format";

const TRUST_ITEMS = [
  { icon: LuFileText, label: "Transparent Pricing" },
  { icon: LuClock, label: "On-Time Service" },
  { icon: LuHeadset, label: "Customer Support" },
];

// Simple flat illustration for the hero card (no external image needed).
function HouseIllustration({ className = "" }) {
  return (
    <svg
      viewBox="0 0 280 190"
      className={className}
      role="img"
      aria-label="Illustration of a well-kept home"
    >
      <ellipse cx="140" cy="178" rx="132" ry="9" fill="#bfdbfe" opacity="0.7" />

      {/* Tree */}
      <rect x="226" y="122" width="8" height="52" rx="3" fill="#92694a" />
      <circle cx="230" cy="108" r="24" fill="#4ade80" />
      <circle cx="215" cy="124" r="16" fill="#22c55e" />
      <circle cx="246" cy="124" r="15" fill="#22c55e" />

      {/* House */}
      <rect x="152" y="46" width="16" height="32" rx="2" fill="#1e40af" />
      <rect x="40" y="94" width="150" height="80" rx="4" fill="#ffffff" />
      <polygon points="26,98 115,36 204,98" fill="#1d4ed8" />
      <circle cx="115" cy="74" r="9" fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />

      {/* Door */}
      <rect x="101" y="126" width="28" height="48" rx="3" fill="#16a34a" />
      <circle cx="123" cy="151" r="2" fill="#dcfce7" />

      {/* Windows */}
      <g fill="#dbeafe" stroke="#93c5fd" strokeWidth="2">
        <rect x="55" y="112" width="34" height="30" rx="2" />
        <rect x="141" y="112" width="34" height="30" rx="2" />
      </g>
      <g stroke="#93c5fd" strokeWidth="2">
        <line x1="72" y1="112" x2="72" y2="142" />
        <line x1="55" y1="127" x2="89" y2="127" />
        <line x1="158" y1="112" x2="158" y2="142" />
        <line x1="141" y1="127" x2="175" y2="127" />
      </g>
    </svg>
  );
}

function AllServices() {
  const [searchParams, setSearchParams] = useSearchParams();

  // The search text lives in the URL (?q=...) so the navbar search box and this
  // page share it, and a filtered view can be linked to.
  const query = searchParams.get("q") || "";
  const results = searchServices(query);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  const scrollToServices = (e) => {
    e.preventDefault();
    document
      .getElementById("our-services")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-gradient-to-b from-white via-slate-50 to-blue-50/60">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="max-w-lg text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Trusted Home Services at Your Doorstep
            </h1>

            <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
              <li>Skilled Technicians</li>
              <li aria-hidden="true" className="text-slate-300">•</li>
              <li>Transparent Process</li>
              <li aria-hidden="true" className="text-slate-300">•</li>
              <li>Hassle-Free Service</li>
            </ul>

            <form
              role="search"
              onSubmit={scrollToServices}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            >
              <LuSearch className="ml-3 shrink-0 text-slate-400" size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search for a service..."
                aria-label="Search for a service"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white transition hover:bg-green-700"
              >
                <LuSearch size={18} />
              </button>
            </form>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 via-blue-50 to-white p-6 sm:p-8">
            <p className="relative z-10 max-w-[16rem] text-2xl font-bold leading-snug text-blue-900 sm:text-3xl">
              A Smarter Home, A Happier You!
            </p>
            <HouseIllustration className="ml-auto -mb-2 mt-2 w-full max-w-[19rem]" />
          </div>
        </div>
      </section>

      {/* -------------------------- Services grid -------------------------- */}
      <section
        id="our-services"
        className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 pt-6 sm:px-6 lg:px-8"
      >
        <h2 className="text-2xl font-bold text-slate-900">Our Services</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose from a wide range of home services
        </p>

        {results.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {results.map((service) => {
              const Icon = service.icon;

              return (
                <li key={service.slug}>
                  <Link
                    to={`/services/${service.slug}`}
                    className="group flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-colors hover:border-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    <span
                      className={`flex h-24 w-full items-center justify-center rounded-xl ${service.tone}`}
                    >
                      <Icon size={48} strokeWidth={1.5} aria-hidden="true" />
                    </span>

                    <span className="mt-4 text-sm font-semibold text-slate-900 sm:text-base">
                      {service.title}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      Visit fee {formatINR(service.visitFee)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-slate-900">
              No services match “{query}”
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a shorter word, like “AC”, “fan” or “plumber”.
            </p>
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Show all services
            </button>
          </div>
        )}

        {/* ------------------------- Trust strip ------------------------- */}
        <div className="mt-10 flex flex-col gap-6 rounded-2xl bg-blue-50 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
              <LuShieldCheck size={28} aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-slate-900">Verified Technicians</p>
              <p className="text-sm text-slate-600">Trusted. Skilled. Always There.</p>
            </div>
          </div>

          <ul className="grid flex-1 grid-cols-3 gap-4 border-t border-blue-100 pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-2 text-center text-xs font-medium text-slate-700 sm:text-sm"
              >
                <Icon size={22} className="text-blue-600" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default AllServices;
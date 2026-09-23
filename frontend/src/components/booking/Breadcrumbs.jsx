import { Link } from "react-router-dom";
import { LuChevronRight } from "react-icons/lu";

// items: [{ label: "Home", to: "/" }, { label: "Services", to: "/services" }, { label: "AC Repair" }]
// The last item is the current page and is not a link.
function Breadcrumbs({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.label} className="flex items-center gap-1.5">
            {index > 0 && (
              <LuChevronRight size={14} className="text-slate-300" aria-hidden="true" />
            )}

            {isLast || !item.to ? (
              <span
                aria-current={isLast ? "page" : undefined}
                className={isLast ? "font-medium text-slate-800" : ""}
              >
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="transition hover:text-blue-600">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
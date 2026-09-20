import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

import { formatINR } from "../../utils/format";

function ServiceCard({ slug, icon: Icon, tone, title, description, visitFee }) {
  return (
    <Link
      to={`/services/${slug}`}
      className="
        group
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-3xl
        bg-white
        border
        border-slate-200
        p-6
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-2xl
        hover:border-blue-500
      "
    >
      {/* Icon */}
      <div
        className={`flex h-32 w-full items-center justify-center rounded-2xl ${tone}`}
      >
        <Icon size={56} strokeWidth={1.5} aria-hidden="true" />
      </div>

      {/* Content */}
      <h3 className="mt-6 text-2xl font-bold text-slate-900 transition group-hover:text-blue-600">
        {title}
      </h3>

      <p className="mt-3 flex-1 text-slate-600 leading-7">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Visit fee {formatINR(visitFee)}
        </span>

        <span
          className="
            flex
            items-center
            gap-2
            font-semibold
            text-blue-600
            transition-all
            group-hover:gap-3
          "
        >
          Book Now

          <FiArrowRight />
        </span>
      </div>
    </Link>
  );
}

export default ServiceCard;
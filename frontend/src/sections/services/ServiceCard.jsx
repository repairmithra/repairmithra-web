import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

import { formatINR } from "../../utils/format";

function ServiceCard({ slug, icon: Icon, image, tone, title, description, visitFee }) {
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
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-2xl
        hover:border-blue-500
      "
    >
      {/* Visual */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        {image ? (
          <>
            {/* Soft blurred backdrop so the frame is always filled */}
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl opacity-50"
            />
            {/* Full, uncropped image on top */}
            <img
              src={image}
              alt={title}
              className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
            <span
              className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-sm backdrop-blur ${tone.split(" ")[1] ?? "text-slate-600"}`}
            >
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${tone}`}>
            <Icon size={56} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-2xl font-bold text-slate-900 transition group-hover:text-blue-600">
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
      </div>
    </Link>
  );
}

export default ServiceCard;
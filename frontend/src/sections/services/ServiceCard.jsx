import { FiArrowRight } from "react-icons/fi";

function ServiceCard({ image, title, description }) {
  return (
    <div
      className="
        group
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
      {/* Image */}
      <div className="overflow-hidden">
        <img
          src={image}
          alt={title}
          className="
            h-56
            w-full
            object-cover
            transition-transform
            duration-500
            group-hover:scale-110
          "
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-3 text-slate-600 leading-7">
          {description}
        </p>

        <button
          className="
            mt-6
            flex
            items-center
            gap-2
            font-semibold
            text-blue-600
            transition
            group-hover:gap-3
          "
        >
          Book Now

          <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

export default ServiceCard;
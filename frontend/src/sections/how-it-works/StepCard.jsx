import { FiArrowRight } from "react-icons/fi";

function StepCard({
  step,
  icon,
  title,
  description,
  last = false,
}) {
  return (
    <div className="relative flex flex-col items-center text-center">

      {/* Step Number */}

      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-lg">
        {step}
      </div>

      {/* Icon */}

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 text-4xl text-blue-600 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
        {icon}
      </div>

      {/* Title */}

      <h3 className="text-2xl font-bold text-slate-900">
        {title}
      </h3>

      {/* Description */}

      <p className="mt-4 max-w-xs leading-7 text-slate-600">
        {description}
      </p>

      {/* Arrow */}

      {!last && (
        <div className="absolute right-[-40px] top-20 hidden xl:block text-blue-400">
          <FiArrowRight size={32} />
        </div>
      )}

    </div>
  );
}

export default StepCard;
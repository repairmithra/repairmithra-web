function FeatureCard({ icon, title, description }) {
  return (
    <div
      className="
        group
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-8
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-2
        hover:border-blue-500
        hover:shadow-xl
      "
    >
      {/* Icon */}

      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-blue-100
          text-3xl
          transition-all
          duration-300
          group-hover:bg-blue-600
          group-hover:text-white
        "
      >
        {icon}
      </div>

      {/* Title */}

      <h3 className="mt-6 text-2xl font-bold text-slate-900">
        {title}
      </h3>

      {/* Description */}

      <p className="mt-4 leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
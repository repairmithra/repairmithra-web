import { FiArrowRight, FiCheckCircle, FiStar } from "react-icons/fi";

function HeroContent() {
  return (
    <div className="max-w-xl">

      {/* Trust Badge */}

      <div className="inline-flex items-center gap-3 rounded-full border border-blue-100 bg-white px-5 py-2 shadow-sm">

        <div className="flex text-yellow-400">
          <FiStar className="fill-yellow-400" />
          <FiStar className="fill-yellow-400" />
          <FiStar className="fill-yellow-400" />
          <FiStar className="fill-yellow-400" />
          <FiStar className="fill-yellow-400" />
        </div>

        <span className="text-sm font-semibold text-slate-700">
          Trusted by 1000+ Customers
        </span>

      </div>

      {/* Heading */}

      <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight text-slate-900 lg:text-6xl">

        Professional

        <span className="block text-blue-600">
          Home Services
        </span>

        Delivered

        <span className="block">
          At Your Doorstep
        </span>

      </h1>

      {/* Description */}

      <p className="mt-8 max-w-lg text-lg leading-8 text-slate-600">

        Book trusted professionals for laptop repair,
        mobile repair, AC servicing, plumbing,
        electrical work and home maintenance.

        Fast response, verified technicians and
        transparent pricing.

      </p>

      {/* Buttons */}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">

        <button
          className="
          rounded-2xl
          bg-gradient-to-r
          from-blue-600
          to-blue-700
          px-9
          py-4
          text-lg
          font-semibold
          text-white
          shadow-xl
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-2xl
          "
        >
          Book Service
        </button>

        <button
          className="
          flex
          items-center
          justify-center
          gap-2
          rounded-2xl
          border
          border-slate-300
          bg-white
          px-9
          py-4
          text-lg
          font-semibold
          text-slate-700
          transition-all
          duration-300
          hover:border-blue-500
          hover:text-blue-600
        "
        >
          Explore Services

          <FiArrowRight />
        </button>

      </div>

      {/* Trust Points */}

      <div className="mt-12 grid grid-cols-2 gap-5">

        {[
          "Verified Professionals",
          "Same Day Service",
          "Transparent Pricing",
          "24×7 Customer Support",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3"
          >
            <FiCheckCircle className="text-xl text-green-500" />

            <span className="font-medium text-slate-700">
              {item}
            </span>

          </div>
        ))}

      </div>

    </div>
  );
}

export default HeroContent;
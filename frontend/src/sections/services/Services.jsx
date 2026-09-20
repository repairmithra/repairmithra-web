import { useNavigate } from "react-router-dom";

import ServiceCard from "./ServiceCard";
import { services } from "../../data/servicesData";

import { FiArrowRight } from "react-icons/fi";

function Services() {
  const navigate = useNavigate();

  return (
    <section className="bg-slate-50 py-24">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-600">
            OUR SERVICES
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900 md:text-5xl">
            Popular Services
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Professional repair and maintenance services delivered by
            experienced and verified technicians at your doorstep.
          </p>

        </div>

        {/* Cards */}

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {services.map((service) => (

            <ServiceCard
              key={service.slug}
              slug={service.slug}
              icon={service.icon}
              tone={service.tone}
              title={service.title}
              description={service.description}
              visitFee={service.visitFee}
            />

          ))}

        </div>

        {/* Button */}

        <div className="mt-16 flex justify-center">

          <button
            onClick={() => navigate("/services")}
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              bg-blue-600
              px-8
              py-4
              text-lg
              font-semibold
              text-white
              shadow-lg
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-blue-700
            "
          >
            View All Services

            <FiArrowRight />
          </button>

        </div>

      </div>

    </section>
  );
}

export default Services;
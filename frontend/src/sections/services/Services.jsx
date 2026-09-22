import { useNavigate } from "react-router-dom";

import ServiceCard from "./ServiceCard";
import { useServices } from "../../hooks/useServices";

import { FiArrowRight } from "react-icons/fi";

// How many services show on the homepage "Popular Services" preview.
// The full list is always available on the "View All Services" page.
const POPULAR_SERVICES_LIMIT = 4;

function Services() {
  const navigate = useNavigate();
  const { services, isLoading, error, reload } = useServices();

  const popularServices = services.slice(0, POPULAR_SERVICES_LIMIT);

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

        {error ? (

          <div
            role="alert"
            className="mt-16 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
          >
            <p className="font-semibold text-slate-900">
              We couldn&apos;t load our services right now.
            </p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={reload}
              className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Try again
            </button>
          </div>

        ) : (

          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

            {isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    aria-hidden="true"
                    className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white"
                  />
                ))
              : popularServices.map((service) => (

                  <ServiceCard
                    key={service.slug}
                    slug={service.slug}
                    icon={service.icon}
                    image={service.image}
                    tone={service.tone}
                    title={service.title}
                    description={service.description}
                    visitFee={service.visitFee}
                  />

                ))}

          </div>

        )}

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
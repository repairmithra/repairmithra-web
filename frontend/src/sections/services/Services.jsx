import ServiceCard from "./ServiceCard";

import laptop from "../../assets/images/services/laptop.jpg";
import mobile from "../../assets/images/services/mobile.jpg";
import ac from "../../assets/images/services/ac.jpg";
import plumbing from "../../assets/images/services/plumbing.jpg";
import electrical from "../../assets/images/services/electrical.jpg";
import cleaning from "../../assets/images/services/cleaning.jpg";

import { FiArrowRight } from "react-icons/fi";

function Services() {
  const services = [
    {
      image: laptop,
      title: "Laptop Repair",
      description:
        "Hardware repair, software troubleshooting, motherboard repair and performance optimization.",
    },
    {
      image: mobile,
      title: "Mobile Repair",
      description:
        "Screen replacement, battery replacement, charging issues and software repair.",
    },
    {
      image: ac,
      title: "AC Repair",
      description:
        "Installation, gas filling, servicing and complete air conditioner maintenance.",
    },
    {
      image: plumbing,
      title: "Plumbing",
      description:
        "Leak repairs, pipe fitting, bathroom maintenance and kitchen plumbing services.",
    },
    {
      image: electrical,
      title: "Electrical",
      description:
        "Switchboard installation, wiring, fan installation and electrical repairs.",
    },
    {
      image: cleaning,
      title: "Home Cleaning",
      description:
        "Professional home deep cleaning for kitchens, bathrooms and complete homes.",
    },
  ];

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

        <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {services.map((service) => (

            <ServiceCard
              key={service.title}
              image={service.image}
              title={service.title}
              description={service.description}
            />

          ))}

        </div>

        {/* Button */}

        <div className="mt-16 flex justify-center">

          <button
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
import {
  FiSearch,
  FiCalendar,
  FiTool,
  FiCheckCircle,
} from "react-icons/fi";

import StepCard from "./StepCard";

function HowItWorks() {
  const steps = [
    {
      step: "1",
      icon: <FiSearch />,
      title: "Choose a Service",
      description:
        "Browse our wide range of home services and select the one you need.",
    },
    {
      step: "2",
      icon: <FiCalendar />,
      title: "Book an Appointment",
      description:
        "Choose your preferred date and time for the service at your convenience.",
    },
    {
      step: "3",
      icon: <FiTool />,
      title: "Technician Arrives",
      description:
        "A verified RepairMithra professional visits your location on time.",
    },
    {
      step: "4",
      icon: <FiCheckCircle />,
      title: "Service Completed",
      description:
        "Relax while we complete the job with quality assurance and satisfaction.",
    },
  ];

  return (
    <section className="bg-slate-50 py-24">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Heading */}

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-600">
            HOW IT WORKS
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900 md:text-5xl">
            Book a Service in 4 Easy Steps
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Getting professional home services has never been easier.
            Book in minutes and let our verified experts take care of the rest.
          </p>

        </div>

        {/* Steps */}

        <div className="mt-20 grid gap-12 md:grid-cols-2 xl:grid-cols-4">

          {steps.map((item, index) => (
            <StepCard
              key={item.step}
              step={item.step}
              icon={item.icon}
              title={item.title}
              description={item.description}
              last={index === steps.length - 1}
            />
          ))}

        </div>

      </div>

    </section>
  );
}

export default HowItWorks;
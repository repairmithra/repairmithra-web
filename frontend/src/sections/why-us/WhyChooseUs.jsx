import {
  FiShield,
  FiClock,
  FiDollarSign,
  FiAward,
  FiHeadphones,
  FiUsers,
} from "react-icons/fi";

import FeatureCard from "./FeatureCard";

function WhyChooseUs() {
  const stats = [
    {
      number: "10,000+",
      label: "Happy Customers",
    },
    {
      number: "500+",
      label: "Verified Technicians",
    },
    {
      number: "15+",
      label: "Services Offered",
    },
    {
      number: "4.9★",
      label: "Average Rating",
    },
  ];

  const features = [
    {
      icon: <FiShield />,
      title: "Verified Professionals",
      description:
        "Every technician is background verified and trained before joining RepairMithra.",
    },
    {
      icon: <FiClock />,
      title: "Same Day Service",
      description:
        "Book today and get your service completed the very same day whenever possible.",
    },
    {
      icon: <FiDollarSign />,
      title: "Transparent Pricing",
      description:
        "Know the estimated price before work begins with no hidden charges.",
    },
    {
      icon: <FiAward />,
      title: "Service Warranty",
      description:
        "Selected services include a warranty for added confidence and peace of mind.",
    },
    {
      icon: <FiUsers />,
      title: "Experienced Experts",
      description:
        "Our technicians bring years of hands-on experience across multiple repair categories.",
    },
    {
      icon: <FiHeadphones />,
      title: "Customer Support",
      description:
        "Need assistance? Our support team is available whenever you need help.",
    },
  ];

  return (
    <section className="bg-white py-24">

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-600">
            WHY REPAIRMITHRA
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900 md:text-5xl">
            Why Choose RepairMithra?
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            We combine trusted professionals, transparent pricing and fast
            service to deliver a hassle-free experience for every customer.
          </p>

        </div>

        {/* Statistics */}

        <div className="mt-16 grid gap-6 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 p-10 text-center text-white md:grid-cols-4">

          {stats.map((item) => (

            <div key={item.label}>

              <h3 className="text-4xl font-black">
                {item.number}
              </h3>

              <p className="mt-2 text-blue-100">
                {item.label}
              </p>

            </div>

          ))}

        </div>

        {/* Features */}

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature) => (

            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />

          ))}

        </div>

      </div>

    </section>
  );
}

export default WhyChooseUs;
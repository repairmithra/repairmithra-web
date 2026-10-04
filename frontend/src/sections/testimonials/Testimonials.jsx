import { useEffect, useState } from "react";
import { FiStar } from "react-icons/fi";

const testimonials = [
  {
    name: "Priya R.",
    service: "AC Repair",
    location: "Jangaon",
    rating: 5,
    feedback:
      "The technician arrived on time and fixed my AC quickly. The service was professional and hassle-free.",
  },
  {
    name: "Rahul K.",
    service: "Plumbing",
    location: "Jangaon",
    rating: 5,
    feedback:
      "Very professional service. The technician explained the problem clearly and completed the repair perfectly.",
  },
  {
    name: "Ananya S.",
    service: "Appliance Repair",
    location: "Jangaon",
    rating: 5,
    feedback:
      "Booking the service was simple and the technician was very polite. I am happy with the overall experience.",
  },
  {
    name: "Kiran M.",
    service: "Electrical Repair",
    location: "Jangaon",
    rating: 5,
    feedback:
      "Quick response and excellent service. Everything was handled professionally from booking to completion.",
  },
  {
    name: "Sneha P.",
    service: "Home Maintenance",
    location: "Jangaon",
    rating: 5,
    feedback:
      "I really liked how easy it was to book a service. The technician was skilled and completed the work neatly.",
  },
  {
    name: "Arjun S.",
    service: "Washing Machine Repair",
    location: "Jangaon",
    rating: 5,
    feedback:
      "The technician diagnosed the issue quickly and fixed it without any unnecessary delay. Great experience.",
  },
];

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setActiveIndex(
          (currentIndex) =>
            (currentIndex + 1) % testimonials.length
        );

        setIsAnimating(false);
      }, 500);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleIndicatorClick = (index) => {
    if (index === activeIndex) return;

    setIsAnimating(true);

    setTimeout(() => {
      setActiveIndex(index);
      setIsAnimating(false);
    }, 500);
  };

  const testimonial = testimonials[activeIndex];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-600">
            CUSTOMER FEEDBACK
          </span>

          <h2 className="mt-6 text-4xl font-black text-slate-900 md:text-5xl">
            What Our Customers Say
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            See what customers can expect from a trusted and
            professional home-service experience.
          </p>

        </div>

        {/* Single Testimonial */}
        <div className="mx-auto mt-16 max-w-3xl">

          <article
            className={`
              overflow-hidden
              rounded-3xl
              border
              border-slate-100
              bg-white
              p-8
              text-center
              shadow-sm
              sm:p-10
              md:p-12
              transition-all
              duration-500
              ease-in-out
              ${
                isAnimating
                  ? "-translate-x-8 opacity-0"
                  : "translate-x-0 opacity-100"
              }
            `}
          >

            {/* Stars */}
            <div className="mb-6 flex justify-center gap-1 text-yellow-400">
              {Array.from({
                length: testimonial.rating,
              }).map((_, index) => (
                <FiStar
                  key={index}
                  size={20}
                  fill="currentColor"
                />
              ))}
            </div>

            {/* Feedback */}
            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              “{testimonial.feedback}”
            </p>

            {/* Customer */}
            <div className="mt-8 flex flex-col items-center">

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-100
                  text-lg
                  font-bold
                  text-blue-600
                "
              >
                {testimonial.name.charAt(0)}
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                {testimonial.name}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {testimonial.service} · {testimonial.location}
              </p>

            </div>

          </article>

          {/* Indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleIndicatorClick(index)}
                aria-label={`Show testimonial ${index + 1}`}
                className={`
                  h-2.5
                  rounded-full
                  transition-all
                  duration-300
                  ${
                    activeIndex === index
                      ? "w-7 bg-blue-600"
                      : "w-2.5 bg-slate-300"
                  }
                `}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

export default Testimonials;


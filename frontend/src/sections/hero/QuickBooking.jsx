import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiTool } from "react-icons/fi";

import { useServices } from "../../hooks/useServices";

function QuickBooking() {
  const navigate = useNavigate();
  const { services, isLoading } = useServices();
  const [selectedSlug, setSelectedSlug] = useState("");

  const handleBook = () => {
    navigate(selectedSlug ? `/services/${selectedSlug}` : "/services");
  };

  return (
    <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">

      <div className="mb-6">

        <h3 className="text-2xl font-bold text-slate-900">
          Book a Service
        </h3>

        <p className="mt-1 text-slate-500">
          Get connected with a verified technician in minutes.
        </p>

      </div>

      <div className="grid gap-4 sm:grid-cols-2">

        {/* Service */}

        <div className="relative">

          <FiTool className="absolute left-4 top-4 text-blue-600" />

          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            aria-label="Select service"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 outline-none transition focus:border-blue-600"
          >

            <option value="">
              {isLoading ? "Loading services..." : "Select Service"}
            </option>

            {services.map((service) => (

              <option key={service.slug} value={service.slug}>

                {service.title}

              </option>

            ))}

          </select>

        </div>

        {/* Location */}

        <div className="relative">

          <FiMapPin className="absolute left-4 top-4 text-blue-600" />

          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 outline-none transition focus:border-blue-600">

            <option>Select City</option>

            <option>Hyderabad</option>

            <option>Warangal</option>

            <option>Jangaon</option>

            <option>Karimnagar</option>

          </select>

        </div>

        {/* Button */}

        <button
          onClick={handleBook}
          className="sm:col-span-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">

          Book Now

        </button>

      </div>

    </div>
  );
}

export default QuickBooking;
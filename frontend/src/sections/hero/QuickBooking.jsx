import { FiMapPin, FiTool } from "react-icons/fi";

function QuickBooking() {
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

      <div className="grid gap-4 md:grid-cols-3">

        {/* Service */}

        <div className="relative">

          <FiTool className="absolute left-4 top-4 text-blue-600" />

          <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 outline-none transition focus:border-blue-600">

            <option>Select Service</option>

            <option>Mobile Repair</option>

            <option>Laptop Repair</option>

            <option>AC Repair</option>

            <option>Plumbing</option>

            <option>Electrical</option>

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

        <button className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl">

          Book Now

        </button>

      </div>

    </div>
  );
}

export default QuickBooking;
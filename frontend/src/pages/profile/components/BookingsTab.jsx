import { useNavigate } from "react-router-dom";
import { FiCalendar } from "react-icons/fi";

import BookingRow from "./BookingRow";

function BookingsTab({ bookings }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-gray-900">
          <FiCalendar className="text-blue-600" /> My Bookings
        </h2>
        <button
          onClick={() => navigate("/services")}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Book a Service
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">
          You haven't booked a service yet. Once you do, it'll show up here.
        </p>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <BookingRow key={booking._id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingsTab;
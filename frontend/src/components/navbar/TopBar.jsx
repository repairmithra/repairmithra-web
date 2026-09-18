import { FiMail, FiMapPin, FiPhoneCall } from "react-icons/fi";

function TopBar({ location = "Hyderabad, Telangana" }) {
  return (
    <div className="hidden lg:block bg-slate-900 text-white">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-6">

          <div className="flex items-center gap-2 text-sm">
            <FiMail className="text-blue-400" />
            <span>service@repairmithra.com</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <FiMapPin className="text-green-400" />
            <span>{location}</span>
          </div>

        </div>

        <div className="flex items-center gap-2 text-sm">
          <FiPhoneCall className="text-blue-400" />
          <span>24×7 Customer Support</span>
        </div>

      </div>
    </div>
  );
}

export default TopBar;
import { FiHeadphones, FiMail, FiPhone, FiClock } from "react-icons/fi";

import { SUPPORT } from "../../../config/site";

function SupportTab() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
        <FiHeadphones className="text-blue-600" /> Support
      </h2>

      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
        <p className="font-semibold">We're here for you, 24/7</p>
        <p className="mt-1 text-sm text-blue-100">
          Reach out any time for help with a booking, payment, or technician visit.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a
          href={SUPPORT.phoneHref}
          className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiPhone size={18} />
          </span>
          <div>
            <p className="text-xs text-gray-500">Call us</p>
            <p className="text-sm font-semibold text-gray-900">{SUPPORT.phone}</p>
          </div>
        </a>

        <a
          href={`mailto:${SUPPORT.email}`}
          className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiMail size={18} />
          </span>
          <div>
            <p className="text-xs text-gray-500">Email us</p>
            <p className="text-sm font-semibold text-gray-900">{SUPPORT.email}</p>
          </div>
        </a>

        <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FiClock size={18} />
          </span>
          <div>
            <p className="text-xs text-gray-500">Support hours</p>
            <p className="text-sm font-semibold text-gray-900">{SUPPORT.hours}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportTab;
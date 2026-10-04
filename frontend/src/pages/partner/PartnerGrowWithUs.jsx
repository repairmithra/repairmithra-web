import { useNavigate } from "react-router-dom";
import {
  FiTrendingUp,
  FiBriefcase,
  FiDollarSign,
  FiBell,
  FiClock,
  FiStar,
  FiUsers,
} from "react-icons/fi";

import PartnerHeader from "./components/PartnerHeader";
import { getToken } from "../../utils/auth";

const BENEFITS = [
  { icon: FiTrendingUp, text: "Get regular service requests" },
  { icon: FiBriefcase, text: "Grow your business" },
  { icon: FiDollarSign, text: "No marketing cost" },
  { icon: FiBell, text: "Receive instant notifications" },
  { icon: FiClock, text: "Flexible working hours" },
  { icon: FiStar, text: "Build your reputation" },
  { icon: FiUsers, text: "Earn more" },
];

function PartnerGrowWithUs() {
  const navigate = useNavigate();
  const isPartnerLoggedIn = Boolean(getToken());

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {isPartnerLoggedIn ? (
        <PartnerHeader title="Grow with Us" />
      ) : (
        <div className="bg-white py-4 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Grow with RepairMithra</h1>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 text-center text-white shadow-lg">
          <h2 className="text-2xl font-extrabold">More Work. More Earnings.</h2>
          <p className="mt-2 text-emerald-50">
            Join thousands of skilled hands building better homes across Telangana.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {BENEFITS.map(({ icon: Icon, text }, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon size={18} />
              </span>
              <span className="font-medium text-slate-700">{text}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-serif text-lg italic text-slate-500">
          Skilled Hands Build Better Homes
        </p>

        {!isPartnerLoggedIn && (
          <button
            onClick={() => navigate("/partner/register")}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
          >
            Join RepairMithra — Be a Part of Smarter Homes!
          </button>
        )}
      </main>
    </div>
  );
}

export default PartnerGrowWithUs;
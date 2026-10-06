import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiBriefcase, FiBell, FiClock, FiChevronRight, FiArrowRight } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { MdVerifiedUser } from "react-icons/md";

import PartnerHeader from "./components/PartnerHeader";
import { getToken } from "../../utils/auth";
import technician from "../../assets/images/partner/grow-technician.png";
import avatars from "../../assets/images/partner/grow-avatars.png";

const BENEFITS = [
  {
    icon: FiTrendingUp,
    title: "Get regular service requests",
    text: "Receive consistent jobs in your area and keep your schedule full.",
  },
  {
    icon: FiBriefcase,
    title: "Grow your business",
    text: "Build your reputation, gain more customers and expand your reach.",
  },
  {
    icon: FaRupeeSign,
    title: "No marketing cost",
    text: "We bring customers to you. You focus on delivering great service.",
  },
  {
    icon: FiBell,
    title: "Receive instant notifications",
    text: "Get real-time alerts for new jobs and never miss an opportunity.",
  },
  {
    icon: FiClock,
    title: "Flexible working hours",
    text: "Work on your time, at your pace. You're the boss!",
  },
];

function PartnerGrowWithUs() {
  const navigate = useNavigate();
  const isPartnerLoggedIn = Boolean(getToken());

  const handleStart = () =>
    navigate(isPartnerLoggedIn ? "/partner/dashboard" : "/partner/register");

  return (
    <div className="min-h-screen bg-white pb-10">
      <PartnerHeader variant="simple" />

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Section title */}
        <div className="flex items-center gap-3 py-4">
          <FiTrendingUp size={28} className="text-emerald-600" strokeWidth={2.5} />
          <h1 className="text-xl font-bold text-slate-900">Grow with Us</h1>
          <span className="h-px w-12 bg-slate-200" />
        </div>

        {/* Hero banner */}
        <section className="relative min-h-[300px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#045644] to-[#07784f] text-white sm:min-h-[340px]">
          <img
            src={technician}
            alt="RepairMithra technician giving a thumbs up"
            className="pointer-events-none absolute bottom-0 right-0 h-full w-auto max-w-none select-none"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 30%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 30%)",
            }}
          />

          <div className="relative z-10 flex h-full max-w-[62%] flex-col justify-center p-6 sm:max-w-[58%] sm:p-8">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              More Work.
              <br />
              <span className="text-[#86febb]">More Earnings.</span>
            </h2>
            <p className="mt-4 text-sm font-medium leading-relaxed text-white sm:text-base">
              Join thousands of skilled hands building better homes across{" "}
              <span className="text-[#86febb]">Telangana.</span>
            </p>

            <button
              onClick={handleStart}
              className="mt-5 inline-flex w-fit items-center gap-3 rounded-xl bg-white py-3 pl-5 pr-3 text-sm font-semibold text-slate-900 shadow-md transition hover:-translate-y-0.5 sm:text-base"
            >
              Start Earning Today
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                <FiArrowRight size={18} />
              </span>
            </button>
          </div>
        </section>

        {/* Benefit cards */}
        <div className="mt-5 space-y-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.06)]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
              <FiChevronRight size={22} className="shrink-0 text-slate-700" />
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50/70 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <MdVerifiedUser size={44} className="shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Trusted by thousands of partners</p>
              <p className="text-xs text-slate-500">
                Join our growing community of skilled professionals.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center rounded-xl bg-emerald-100/60 p-2">
            <img src={avatars} alt="" className="h-9 w-auto rounded-full" />
            <span className="-ml-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-[10px] font-bold text-white">
              10K+
            </span>
            <div className="ml-2 hidden leading-tight sm:block">
              <p className="text-lg font-extrabold text-emerald-600">10K+</p>
              <p className="text-xs text-slate-600">Partners</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PartnerGrowWithUs;
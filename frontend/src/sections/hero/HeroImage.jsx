import heroImage from "../../assets/images/hero/hero-technician.jpg";
import {
  FiCheckCircle,
  FiStar,
  FiTool,
} from "react-icons/fi";

function HeroImage() {
  return (
    <div className="relative flex justify-center items-center">

      {/* Background Glow */}
      <div className="absolute h-[520px] w-[520px] rounded-full bg-blue-100 blur-3xl opacity-50"></div>

      {/* Main Image Card */}
      <div className="relative z-10 overflow-hidden rounded-[32px] bg-white p-5 shadow-2xl border border-slate-100">

        <img
          src={heroImage}
          alt="RepairMithra Technician"
          className="w-full max-w-md rounded-3xl object-cover"
        />

      </div>

      {/* Rating Card */}
      <div className="absolute left-0 top-10 z-20 rounded-2xl bg-white px-5 py-4 shadow-xl border border-slate-100">

        <div className="flex items-center gap-2">

          <FiStar className="fill-yellow-400 text-yellow-400" />

          <div>
            <h4 className="font-bold text-slate-900">
              4.9 Rating
            </h4>

            <p className="text-sm text-slate-500">
              5,000+ Happy Customers
            </p>
          </div>

        </div>

      </div>

      {/* Verified Card */}
      <div className="absolute right-0 bottom-24 z-20 rounded-2xl bg-white px-5 py-4 shadow-xl border border-slate-100">

        <div className="flex items-center gap-3">

          <FiCheckCircle className="text-2xl text-green-500" />

          <div>

            <h4 className="font-bold text-slate-900">
              Verified
            </h4>

            <p className="text-sm text-slate-500">
              Certified Technician
            </p>

          </div>

        </div>

      </div>

      {/* Experience Card */}
      <div className="absolute bottom-0 left-20 z-20 rounded-2xl bg-blue-600 px-6 py-5 text-white shadow-xl">

        <div className="flex items-center gap-3">

          <FiTool className="text-2xl" />

          <div>

            <h4 className="text-xl font-bold">
              10+ Years
            </h4>

            <p className="text-blue-100">
              Service Experience
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default HeroImage;
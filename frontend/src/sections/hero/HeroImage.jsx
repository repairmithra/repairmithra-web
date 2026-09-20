import heroImage from "../../assets/images/hero/hero-technician.jpg";
import {
  FiCheckCircle,
  FiStar,
  FiTool,
} from "react-icons/fi";

function HeroImage() {
  return (
    <div
      className="
        relative
        flex
        w-full
        items-center
        justify-center
        lg:justify-end
        lg:-mt-6
      "
    >
      {/* Background Glow */}
      <div
        className="
          pointer-events-none
          absolute
          h-[300px]
          w-[300px]
          rounded-full
          bg-blue-100
          opacity-50
          blur-3xl
          sm:h-[420px]
          sm:w-[420px]
          lg:h-[520px]
          lg:w-[520px]
        "
      />

      {/* Image */}
      <div
        className="
          relative
          z-10
          w-full
          max-w-[560px]
          rounded-[32px]
          bg-white
          p-3
          shadow-2xl
          sm:p-4
          lg:p-5
        "
      >
        <img
          src={heroImage}
          alt="RepairMithra Technician"
          className="
            block
            h-auto
            w-full
            rounded-[26px]
            object-contain
          "
        />
      </div>

      {/* Rating */}
      <div
        className="
          absolute
          left-0
          top-6
          z-20
          rounded-2xl
          border
          border-slate-100
          bg-white
          px-4
          py-3
          shadow-xl
          sm:left-2
          sm:top-8
          sm:px-5
          sm:py-4
          lg:left-0
          lg:top-10
        "
      >
        <div className="flex items-center gap-2">
          <FiStar className="fill-yellow-400 text-yellow-400" />

          <div>
            <h4 className="font-bold text-slate-900">
              4.5 Rating
            </h4>

            <p className="text-xs text-slate-500 sm:text-sm">
              500+ Happy Customers
            </p>
          </div>
        </div>
      </div>

      {/* Verified */}
      <div
        className="
          absolute
          right-0
          bottom-16
          z-20
          rounded-2xl
          border
          border-slate-100
          bg-white
          px-4
          py-3
          shadow-xl
          sm:right-2
          sm:bottom-20
          sm:px-5
          sm:py-4
          lg:right-0
          lg:bottom-24
        "
      >
        <div className="flex items-center gap-3">
          <FiCheckCircle className="text-2xl text-green-500" />

          <div>
            <h4 className="font-bold text-slate-900">
              Verified
            </h4>

            <p className="text-xs text-slate-500 sm:text-sm">
              Certified Technician
            </p>
          </div>
        </div>
      </div>

      {/* Experience */}
      <div
        className="
          absolute
          bottom-[-18px]
          left-1/2
          z-20
          hidden
          -translate-x-1/2
          rounded-2xl
          bg-blue-600
          px-5
          py-4
          text-white
          shadow-xl
          sm:block
          lg:bottom-[-20px]
          lg:left-16
          lg:translate-x-0
          lg:px-6
          lg:py-5
        "
      >
        <div className="flex items-center gap-3">
          <FiTool className="text-2xl" />

          
        </div>
      </div>
    </div>
  );
}

export default HeroImage;
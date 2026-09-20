import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-blue-50">

      {/* Background Blur */}
      <div
        className="
          pointer-events-none
          absolute
          -top-40
          -right-40
          h-[350px]
          w-[350px]
          rounded-full
          bg-blue-200
          opacity-30
          blur-3xl
          sm:h-[450px]
          sm:w-[450px]
          lg:h-[600px]
          lg:w-[600px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          bottom-0
          -left-40
          h-[300px]
          w-[300px]
          rounded-full
          bg-cyan-200
          opacity-20
          blur-3xl
          sm:h-[400px]
          sm:w-[400px]
          lg:h-[450px]
          lg:w-[450px]
        "
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div
          className="
            grid
            items-center
            gap-10
            py-12
            sm:gap-14
            sm:py-16
            lg:min-h-[calc(100vh-80px)]
            lg:grid-cols-2
            lg:gap-12
            lg:py-16
            xl:gap-20
          "
        >

          {/* Left Content */}
          <div className="relative z-10 w-full">
            <HeroContent />
          </div>

          {/* Right Image */}
<div className="relative z-10 flex w-full justify-center lg:justify-end lg:-mt-29">            <HeroImage />
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;
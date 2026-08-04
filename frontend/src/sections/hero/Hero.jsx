import HeroContent from "./HeroContent";
import HeroImage from "./HeroImage";
import QuickBooking from "./QuickBooking";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-blue-50">

      {/* Large Background Blur */}

      <div className="absolute -top-40 -right-32 h-[600px] w-[600px] rounded-full bg-blue-200 opacity-30 blur-3xl"></div>

      <div className="absolute bottom-0 -left-32 h-[450px] w-[450px] rounded-full bg-cyan-200 opacity-20 blur-3xl"></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid min-h-[90vh] items-center gap-20 py-24 lg:grid-cols-2">

        
<div>
  <HeroContent />
  <QuickBooking />
</div>
          <HeroImage />

        </div>

      </div>

    </section>
  );
}

export default Hero;
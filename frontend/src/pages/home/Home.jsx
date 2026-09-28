import Hero from "../../sections/hero/Hero";
import Services from "../../sections/services/Services";
import WhyChooseUs from "../../sections/why-us/WhyChooseUs";
import HowItWorks from "../../sections/how-it-works/HowItWorks";
import Testimonials from "../../sections/testimonials/Testimonials";

function Home() {
  return (
    <>
      <Hero />
      <Services />
      <WhyChooseUs />
      <Testimonials />
      <HowItWorks />
    </>
  );
}

export default Home;
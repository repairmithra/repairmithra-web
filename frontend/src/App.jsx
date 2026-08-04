import Navbar from "./components/navbar/Navbar";
import Hero from "./sections/hero/Hero";
import Services from "./sections/services/Services";
import WhyChooseUs from "./sections/why-us/WhyChooseUs";
import HowItWorks from "./sections/how-it-works/HowItWorks";
import Footer from "./sections/footer/Footer";

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <WhyChooseUs />
      <HowItWorks />
      <Footer />

    </>
  );
}

export default App;
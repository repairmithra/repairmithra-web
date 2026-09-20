import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./sections/footer/Footer";

import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Registration from "./pages/register/Registration";
import AllServices from "./pages/services/AllServices";
import ServiceDetail from "./pages/services/ServiceDetail";
import BookService from "./pages/services/BookService";
import Payment from "./pages/services/Payment";
import BookingConfirmed from "./pages/booking/BookingConfirmed";
import BookingStatus from "./pages/booking/BookingStatus";

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />

        {/* Services → detail → address & schedule → payment → confirmation */}
        <Route path="/services" element={<AllServices />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/services/:slug/book" element={<BookService />} />
        <Route path="/services/:slug/payment" element={<Payment />} />
        <Route path="/booking/:bookingId/confirmation" element={<BookingConfirmed />} />
        <Route path="/booking/:bookingId" element={<BookingStatus />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;

import { Routes, Route, useLocation } from "react-router-dom";

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
import Profile from "./pages/profile/Profile";

// Partner Workflow
import PartnerRegister from "./pages/partner/PartnerRegister";
import PartnerVerify from "./pages/partner/PartnerVerify";
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerJobs from "./pages/partner/PartnerJobs";
import PartnerJobDetails from "./pages/partner/PartnerJobDetails";
import PartnerEarnings from "./pages/partner/PartnerEarnings";
import PartnerProfile from "./pages/partner/PartnerProfile";
import PartnerGrowWithUs from "./pages/partner/PartnerGrowWithUs";

// The logged-in partner app (dashboard, jobs, earnings, profile) has its own
// PartnerHeader and should not show the customer site's Navbar/Footer.
// Partner Register/Verify/Login/Grow-with-Us stay inside the normal site
// chrome, same as the customer Login/Registration pages.
const PARTNER_APP_PATTERN = /^\/partner\/(dashboard|jobs|earnings|profile)/;

function App() {
  const location = useLocation();
  const isPartnerApp = PARTNER_APP_PATTERN.test(location.pathname);

  return (
    <>
      <ScrollToTop />
      {!isPartnerApp && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/profile" element={<Profile />} />

        {/* Services → detail → address & schedule → payment → confirmation */}
        <Route path="/services" element={<AllServices />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/services/:slug/book" element={<BookService />} />
        <Route path="/services/:slug/payment" element={<Payment />} />
        <Route path="/booking/:bookingId/confirmation" element={<BookingConfirmed />} />
        <Route path="/booking/:bookingId" element={<BookingStatus />} />

        {/* Partner Workflow: Registration → Verification → Login → Dashboard →
            Job Details / Service Flow → Earnings → Profile → Grow with Us */}
        <Route path="/partner/register" element={<PartnerRegister />} />
        <Route path="/partner/verify" element={<PartnerVerify />} />
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
        <Route path="/partner/jobs" element={<PartnerJobs />} />
        <Route path="/partner/jobs/:id" element={<PartnerJobDetails />} />
        <Route path="/partner/earnings" element={<PartnerEarnings />} />
        <Route path="/partner/profile" element={<PartnerProfile />} />
        <Route path="/partner/grow" element={<PartnerGrowWithUs />} />
      </Routes>

      {!isPartnerApp && <Footer />}
    </>
  );
}

export default App;
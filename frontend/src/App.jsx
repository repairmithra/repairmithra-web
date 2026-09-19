import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import Footer from "./sections/footer/Footer";

import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Registration from "./pages/register/Registration";
function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
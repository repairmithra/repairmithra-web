import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar/Navbar";
import Footer from "./sections/footer/Footer";

import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Registration from "./pages/register/Registration";
import Profile from "./pages/profile/Profile";

function App() {
  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Home />
            <Footer />
          </>
        }
      />

      {/* Login - Standalone */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Registration - Standalone */}
      <Route
        path="/register"
        element={<Registration />}
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <>
            <Navbar />
            <Profile />
            <Footer />
          </>
        }
      />
    </Routes>
  );
}

export default App;
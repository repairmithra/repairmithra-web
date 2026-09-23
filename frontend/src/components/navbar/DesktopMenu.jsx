import { useNavigate } from "react-router-dom";

function DesktopMenu() {
  const navigate = useNavigate();

  return (
    <div className="hidden lg:flex items-center gap-10">

      <a
        onClick={() => navigate("/")}
        className="font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer"
      >
        Home
      </a>

      <a
        onClick={() => navigate("/services")}
        className="font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer"
      >
        Services
      </a>

    </div>
  );
}

export default DesktopMenu;
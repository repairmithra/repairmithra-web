import { useNavigate } from "react-router-dom";

function DesktopMenu() {
  const navigate = useNavigate();

  return (
    <div className="hidden lg:flex items-center gap-10">

      {/* Home */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer"
      >
        Home
      </button>

      {/* Services */}
      <button
        type="button"
        onClick={() => navigate("/services")}
        className="font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer"
      >
        Services
      </button>

    </div>
  );
}

export default DesktopMenu;
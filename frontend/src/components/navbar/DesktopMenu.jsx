import { useState } from "react";
import {
  FiChevronDown,
  FiSmartphone,
  FiMonitor,
  FiWind,
  FiTool,
  FiZap,
} from "react-icons/fi";

function DesktopMenu() {
  const [serviceOpen, setServiceOpen] = useState(false);

  const services = [
    {
      icon: <FiSmartphone className="text-blue-600 text-xl" />,
      title: "Mobile Repair",
      desc: "Screen • Battery • Software",
    },
    {
      icon: <FiMonitor className="text-blue-600 text-xl" />,
      title: "Laptop Repair",
      desc: "Display • Keyboard • Motherboard",
    },
    {
      icon: <FiWind className="text-blue-600 text-xl" />,
      title: "AC Repair",
      desc: "Installation & Service",
    },
    {
      icon: <FiTool className="text-blue-600 text-xl" />,
      title: "Plumbing",
      desc: "Pipes • Leakage • Bathroom",
    },
    {
      icon: <FiZap className="text-blue-600 text-xl" />,
      title: "Electrical",
      desc: "Wiring • Switches • Fans",
    },
  ];

  return (
    <div className="hidden lg:flex items-center gap-10">

      <a className="font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer">
        Home
      </a>

      {/* Services */}

      <div
        className="relative"
        onMouseEnter={() => setServiceOpen(true)}
        onMouseLeave={() => setServiceOpen(false)}
      >
        <button className="flex items-center gap-1 font-medium text-slate-700 hover:text-blue-600 transition">
          Services
          <FiChevronDown className="text-sm" />
        </button>

        {serviceOpen && (
          <div className="absolute top-12 left-0 w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">

            {services.map((item) => (
              <button
                key={item.title}
                className="flex w-full gap-4 p-4 hover:bg-blue-50 transition text-left"
              >
                {item.icon}

                <div>
                  <h4 className="font-semibold text-slate-800">
                    {item.title}
                  </h4>

                  <p className="text-sm text-gray-500">
                    {item.desc}
                  </p>
                </div>

              </button>
            ))}

          </div>
        )}
      </div>

      <a className="font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer">
        Contact
      </a>

    </div>
  );
}

export default DesktopMenu;
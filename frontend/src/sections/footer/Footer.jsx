import { useNavigate } from "react-router-dom";

import { useServices } from "../../hooks/useServices";
import {
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";

function Footer() {
  const navigate = useNavigate();
  const { services } = useServices();

  return (
    <footer className="bg-slate-950 text-white">

      <div className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">

          {/* Company */}

          <div className="lg:col-span-2">

            <h2 className="text-3xl font-black text-blue-400">
              RepairMithra
            </h2>

            <p className="mt-6 leading-8 text-slate-300">
              Trusted doorstep repair and maintenance
              platform connecting customers with verified
              professionals for quality home services.
            </p>

            <div className="mt-8 space-y-4">

              <div className="flex items-center gap-3">

                <FiMapPin className="text-blue-400" />

                Hyderabad, Telangana

              </div>

              <div className="flex items-center gap-3">

                <FiMail className="text-blue-400" />

                service@repairmithra.com

              </div>

              <div className="flex items-center gap-3">

                <FiPhone className="text-blue-400" />

                +91 XXXXX XXXXX

              </div>

            </div>

          </div>

          {/* Company */}

          <div>

            <h3 className="mb-6 text-xl font-bold">
              Company
            </h3>

            <ul className="space-y-3 text-slate-300">

              <li>About Us</li>
              <li
                className="cursor-pointer hover:text-blue-400 transition"
                onClick={() => navigate("/services")}
              >
                Services
              </li>
              <li>Locations</li>
              <li>Join as Pro</li>

            </ul>

          </div>

          {/* Services */}

          <div>

            <h3 className="mb-6 text-xl font-bold">
              Services
            </h3>

            <ul className="space-y-3 text-slate-300">

              {services.map((service) => (
                <li
                  key={service.slug}
                  className="cursor-pointer hover:text-blue-400 transition"
                  onClick={() => navigate(`/services/${service.slug}`)}
                >
                  {service.title}
                </li>
              ))}

            </ul>

          </div>

          {/* Support */}

          <div>

            <h3 className="mb-6 text-xl font-bold">
              Support
            </h3>

            <ul className="space-y-3 text-slate-300">

              <li>FAQ</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
              <li>Contact Us</li>

            </ul>

          </div>

        </div>

        <div className="mt-16 border-t border-slate-800 pt-8 text-center text-slate-400">

          © 2026 RepairMithra. All Rights Reserved.

        </div>

      </div>

    </footer>
  );
}

export default Footer;
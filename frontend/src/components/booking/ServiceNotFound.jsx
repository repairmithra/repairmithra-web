import { Link } from "react-router-dom";

function ServiceNotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">Service not found</h1>
      <p className="mt-3 max-w-md text-slate-600">
        We couldn't find that service. It may have been renamed or removed.
      </p>
      <Link
        to="/services"
        className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
      >
        View all services
      </Link>
    </section>
  );
}

export default ServiceNotFound;
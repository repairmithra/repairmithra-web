import { LuLoader, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

// Full-page states shown while services are loading from the server,
// or when the server could not be reached.

export function ServicesLoading({ label = "Loading services..." }) {
  return (
    <section
      role="status"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <LuLoader className="animate-spin text-blue-600" size={32} aria-hidden="true" />
      <p className="mt-4 text-slate-600">{label}</p>
    </section>
  );
}

export function ServicesError({ message, onRetry }) {
  return (
    <section
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <LuTriangleAlert size={28} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        We couldn&apos;t load our services
      </h1>
      <p className="mt-2 max-w-md text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        <LuRefreshCw size={18} aria-hidden="true" />
        Try again
      </button>
    </section>
  );
}
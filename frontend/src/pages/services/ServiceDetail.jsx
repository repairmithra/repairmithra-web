import { Link, Navigate, useParams } from "react-router-dom";
import {
  LuCalendarCheck,
  LuCheck,
  LuCircleCheck,
  LuIndianRupee,
  LuShieldCheck,
} from "react-icons/lu";

import Breadcrumbs from "../../components/booking/Breadcrumbs";
import ServiceNotFound from "../../components/booking/ServiceNotFound";
import { ServicesError, ServicesLoading } from "../../components/booking/ServicesStatus";
import { serviceBenefits } from "../../data/servicesData";
import { useServices } from "../../hooks/useServices";
import { formatINR } from "../../utils/format";

function ServiceDetail() {
  const { slug } = useParams();
  const { isLoading, error, reload, getServiceBySlug } = useServices();

  if (isLoading) return <ServicesLoading />;
  if (error) return <ServicesError message={error} onRetry={reload} />;

  const service = getServiceBySlug(slug);

  if (!service) return <ServiceNotFound />;

  // Old URLs (e.g. /services/laptop-repair) are forwarded to the current slug.
  if (service.slug !== slug) {
    return <Navigate to={`/services/${service.slug}`} replace />;
  }

  const Icon = service.icon;

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-blue-50/50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Services", to: "/services" },
            { label: service.title },
          ]}
        />

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          {service.image ? (
            <div className="relative h-48 w-full overflow-hidden bg-slate-100 sm:h-64">
              {/* Soft blurred backdrop so the frame is always filled */}
              <img
                src={service.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover object-center blur-xl opacity-50"
              />
              {/* Full, uncropped image on top */}
              <img
                src={service.image}
                alt={service.title}
                className="relative h-full w-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-8">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-sm ${service.tone.split(" ")[1] ?? "text-slate-600"}`}
                >
                  <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div>
                  <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                    {service.title}
                  </h1>
                  <p className="mt-1 text-sm text-white/90 sm:text-base">{service.tagline}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-8">
              <span
                className={`flex h-28 w-full shrink-0 items-center justify-center rounded-2xl sm:w-44 ${service.tone}`}
              >
                <Icon size={56} strokeWidth={1.5} aria-hidden="true" />
              </span>

              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">
                  {service.title}
                </h1>
                <p className="mt-2 text-slate-600">{service.tagline}</p>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8">
          {/* Visit fee + estimate */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                  <LuIndianRupee size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-600">Visit Fee</p>
                  <p className="text-3xl font-extrabold leading-none text-slate-900">
                    {formatINR(service.visitFee)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Pay now to book a technician visit. This covers visit,
                inspection and diagnosis.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <LuShieldCheck size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Estimated Repair Cost
                  </p>
                  <p className="text-2xl font-extrabold leading-none text-slate-900">
                    {formatINR(service.estimateMin)} – {formatINR(service.estimateMax)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Final cost depends on the issue, parts and labour. You will
                pay the repair amount directly to the technician after
                diagnosis.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <ul className="mt-7 space-y-3">
            {serviceBenefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                  <LuCheck size={12} strokeWidth={3} aria-hidden="true" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* Common issues */}
          {service.issues.length > 0 && (
          <div className="mt-7 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-900">
              Common {service.issueLabel} Issues We Fix
            </h2>

            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[...service.issues, "More..."].map((issue) => (
                <li key={issue} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <LuCircleCheck
                    size={18}
                    className="shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
          )}

          <Link
            to={`/services/${service.slug}/book`}
            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
          >
            <LuCalendarCheck size={22} aria-hidden="true" />
            Book {service.title} Visit
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetail;
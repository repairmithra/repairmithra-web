import { FiChevronRight } from "react-icons/fi";

function StatCard({ icon: Icon, value, label, tone = "blue", arrow = false }) {
  const tones = {
    blue: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="truncate text-xs text-gray-500">{label}</p>
      </div>
      {arrow && <FiChevronRight className="shrink-0 text-gray-300" size={18} />}
    </div>
  );
}

export default StatCard;
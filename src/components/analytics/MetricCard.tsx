export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-slate-400" />
        {hint}
      </p>}
    </div>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="w-full min-w-0 space-y-6 py-4 animate-pulse md:space-y-8 md:py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-10 w-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-slate-300 rounded-md" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded-md" />
          <div className="flex items-end gap-3 h-56 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 bg-slate-100 rounded-t-md" style={{ height: `${30 + i * 12}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="h-5 w-40 bg-slate-200 rounded-md" />
          <div className="flex items-center justify-center py-8">
            <div className="h-44 w-44 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

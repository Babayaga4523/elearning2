export default function CourseReportLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-100 rounded" />
        <div className="h-9 w-72 bg-slate-200 rounded-lg" />
        <div className="h-4 w-56 bg-slate-100 rounded" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-14 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-48 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 h-14 bg-slate-50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
            <div className="h-9 w-9 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-12 bg-slate-100 rounded" />
            <div className="h-4 w-12 bg-slate-100 rounded" />
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

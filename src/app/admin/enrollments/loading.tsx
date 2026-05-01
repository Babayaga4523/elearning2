export default function EnrollmentsLoading() {
  return (
    <div className="w-full min-w-0 space-y-6 animate-pulse pb-8 md:space-y-8 md:pb-10">
      <div className="space-y-2">
        <div className="h-9 w-64 bg-slate-200 rounded-lg" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-8 w-14 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 h-16 bg-slate-50" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50">
            <div className="h-9 w-9 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-52 bg-slate-100 rounded" />
            </div>
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-4 w-14 bg-slate-100 rounded" />
            <div className="h-4 w-14 bg-slate-100 rounded" />
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

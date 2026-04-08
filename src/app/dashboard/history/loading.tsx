export default function HistoryLoading() {
  return (
    <div className="p-6 md:p-10 space-y-10 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-200 rounded-lg" />
          <div className="h-9 w-72 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-4 w-80 bg-slate-100 rounded ml-11" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Assessment Records */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-slate-200 rounded" />
            <div className="h-6 w-40 bg-slate-200 rounded-lg" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                    <div className="h-5 w-48 bg-slate-200 rounded" />
                    <div className="h-3 w-40 bg-slate-100 rounded" />
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                    <div className="h-6 w-20 bg-slate-100 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Completions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-slate-200 rounded" />
            <div className="h-6 w-44 bg-slate-200 rounded-lg" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 pl-7 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-5 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-36 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-52 bg-slate-200 rounded-lg" />
        <div className="h-4 w-80 bg-slate-100 rounded-md" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-1.5">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-100 rounded" />
            </div>
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <div className="h-3.5 w-40 bg-slate-100 rounded" />
                  <div className="h-5 w-24 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

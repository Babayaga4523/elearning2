export default function UsersLoading() {
  return (
    <div className="w-full min-w-0 space-y-6 animate-pulse md:space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-56 bg-slate-200 rounded-lg" />
        <div className="h-4 w-80 bg-slate-100 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-200 rounded-xl" />
            <div className="space-y-2">
              <div className="h-7 w-12 bg-slate-300 rounded" />
              <div className="h-3 w-28 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="h-5 w-36 bg-slate-200 rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-slate-50 last:border-0">
            <div className="h-9 w-9 bg-slate-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
            </div>
            <div className="h-3.5 w-20 bg-slate-100 rounded" />
            <div className="h-5 w-8 bg-slate-200 rounded" />
            <div className="h-5 w-8 bg-slate-200 rounded" />
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

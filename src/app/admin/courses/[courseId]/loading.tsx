export default function CourseSetupLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12 pb-20 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-100">
        <div className="space-y-3">
          <div className="h-3 w-32 bg-slate-100 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-xl" />
            <div className="h-9 w-48 bg-slate-200 rounded-lg" />
          </div>
        </div>
        {/* Wizard steps skeleton */}
        <div className="flex-1 max-w-2xl px-4 flex items-center gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="h-8 w-8 bg-slate-200 rounded-full shrink-0" />
              <div className="h-3 w-16 bg-slate-100 rounded hidden sm:block" />
              {i < 2 && <div className="flex-1 h-0.5 bg-slate-100" />}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="h-11 w-24 bg-slate-100 rounded-xl" />
          <div className="h-11 w-36 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-5 w-36 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="rounded-3xl bg-white shadow-xl p-10 space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
            ))}
            <div className="pt-4 p-6 bg-slate-50 rounded-2xl space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-8 bg-slate-200 rounded" />
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

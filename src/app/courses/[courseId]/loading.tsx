export default function CourseDetailLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-slate-100 rounded mb-8" />

      {/* Hero enrollment banner */}
      <div className="h-52 rounded-3xl bg-slate-200 mb-12" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left — course info + module list */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <div className="h-10 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-4/5 bg-slate-100 rounded" />
          </div>

          <div className="space-y-4">
            <div className="h-7 w-40 bg-slate-200 rounded-lg" />
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Pre-test skeleton */}
              <div className="flex items-center p-4 border-b bg-slate-50 gap-4">
                <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-56 bg-slate-100 rounded" />
                </div>
                <div className="h-9 w-24 bg-slate-200 rounded-lg" />
              </div>
              {/* Module list skeletons */}
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center p-6 border-b gap-6">
                  <div className="h-12 w-12 bg-slate-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                    <div className="h-5 w-48 bg-slate-200 rounded" />
                    <div className="flex gap-2">
                      <div className="h-4 w-14 bg-slate-100 rounded-full" />
                      <div className="h-4 w-16 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                  <div className="h-10 w-28 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — summary card */}
        <div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
            <div className="h-6 w-36 bg-slate-200 rounded" />
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-slate-100 rounded" />
              <div className="h-4 w-10 bg-slate-200 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              {[0, 1].map((i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 text-center space-y-2">
                  <div className="h-7 w-10 bg-slate-200 rounded mx-auto" />
                  <div className="h-3 w-16 bg-slate-100 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

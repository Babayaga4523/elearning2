// This file is automatically used by Next.js App Router to show a loading UI
// while server components on this route are fetching data.
// It renders instantly — giving users immediate visual feedback on page transitions.

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-56 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
          <div className="h-10 w-36 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-10 w-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-slate-300 rounded-md" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart Skeleton */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded-md" />
            <div className="flex items-end gap-3 h-48 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-slate-100 rounded-t-md"
                  style={{ height: `${40 + i * 15}%` }}
                />
              ))}
            </div>
          </div>

          {/* Activity Feed Skeleton */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="h-5 w-36 bg-slate-200 rounded-md" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-40 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-3 w-16 bg-slate-100 rounded ml-auto" />
                  <div className="h-4 w-20 bg-slate-200 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart + Info Card Skeleton */}
        <div className="space-y-8">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
            <div className="h-5 w-36 bg-slate-200 rounded-md" />
            <div className="flex items-center justify-center py-6">
              <div className="h-40 w-40 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-200 h-48" />
        </div>
      </div>
    </div>
  );
}

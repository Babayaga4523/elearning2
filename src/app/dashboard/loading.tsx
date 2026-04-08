// Loading skeleton for the employee dashboard.
// Rendered immediately by Next.js while server data is being fetched.

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-52 bg-slate-100 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-48 bg-slate-200 rounded-lg" />
          <div className="h-10 w-24 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Course Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="h-40 bg-slate-200 w-full" />
            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="h-5 w-48 bg-slate-200 rounded-md" />
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div className="h-2 w-1/3 bg-slate-200 rounded-full" />
                </div>
              </div>
              <div className="h-3 w-36 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Explore Section Skeleton */}
      <div className="mt-12 space-y-4">
        <div className="h-7 w-52 bg-slate-200 rounded-lg" />
        <div className="h-16 w-full bg-slate-100 rounded-md" />
      </div>
    </div>
  );
}

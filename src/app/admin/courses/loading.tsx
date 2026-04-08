export default function CoursesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-slate-200 rounded-lg" />
          <div className="h-4 w-56 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
          {["Judul", "Kategori", "Modul", "Status", "Aksi"].map((h) => (
            <div key={h} className="h-3.5 bg-slate-200 rounded w-16" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-5 gap-4 items-center px-6 py-4 border-b border-slate-50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg shrink-0" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-8 bg-slate-100 rounded" />
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-8 w-16 bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

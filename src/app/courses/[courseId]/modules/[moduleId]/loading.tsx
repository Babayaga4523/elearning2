export default function ModuleLoading() {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-pulse">
      {/* Sticky topbar */}
      <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-slate-100 rounded" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-24 bg-slate-100 rounded-full" />
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* Video/PDF viewer skeleton */}
        <div className="aspect-video bg-slate-200 rounded-2xl w-full" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Content info */}
          <div className="md:col-span-2 space-y-4">
            <div className="h-9 w-3/4 bg-slate-200 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-4 w-4/6 bg-slate-100 rounded" />
            </div>
          </div>

          {/* Control panel */}
          <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-48 bg-slate-100 rounded" />
            <div className="h-11 w-full bg-slate-200 rounded-lg" />
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

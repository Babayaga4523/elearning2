import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
         <span className="text-2xl">📁</span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs text-slate-500 max-w-[250px] mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

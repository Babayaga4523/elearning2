import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-[#E4E7EC] font-['DM_Sans']">
      <div className="h-12 w-12 rounded-xl bg-[#F8F9FB] flex items-center justify-center mb-4 border border-[#E4E7EC]">
         <span className="text-2xl">📁</span>
      </div>
      <p className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">{title}</p>
      <p className="mt-1 text-[13px] text-[#475467] max-w-[250px] mx-auto font-medium">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

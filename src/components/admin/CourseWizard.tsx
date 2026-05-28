"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutGrid,
  Globe,
  Settings,
  Check,
} from "lucide-react";
import Link from "next/link";

type Step = {
  id: number;
  label: string;
  description: string;
  icon: React.ElementType;
};

const STEPS: Step[] = [
  { id: 1, label: "Identitas", description: "Siapkan Kursus", icon: BookOpen },
  { id: 2, label: "Kurikulum", description: "Materi & Tes", icon: LayoutGrid },
  { id: 3, label: "Pengaturan", description: "Detail & Deadline", icon: Settings },
  { id: 4, label: "Publikasi", description: "Review & Live", icon: Globe },
];

type CourseWizardProps = {
  activeStep: number;
  courseId?: string;
};

export function CourseWizard({ activeStep, courseId }: CourseWizardProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = activeStep > step.id;
          const isActive = activeStep === step.id;
          const isClickable = courseId != null;

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0 last:flex-none">
              {/* Step node */}
              <div className="flex flex-col items-center">
                {isClickable ? (
                  <Link
                    href={`/admin/courses/${courseId}?step=${step.id}`}
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center border-2 transition-all duration-200 font-bold text-xs shadow-sm",
                      "hover:scale-105 active:scale-95",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-100"
                        : isActive
                        ? "bg-[#0F1C3F] border-[#0F1C3F] text-[#E8A020] shadow-lg shadow-[#0F1C3F]/20"
                        : "bg-white border-[#E4E7EC] text-[#98A2B3] hover:border-[#0F1C3F]/40"
                    )}
                  >
                    {isCompleted ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <step.icon size={14} />
                    )}
                  </Link>
                ) : (
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center border-2 font-bold text-xs",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-400 text-white"
                        : isActive
                        ? "bg-[#0F1C3F] border-[#0F1C3F] text-[#E8A020]"
                        : "bg-white border-[#E4E7EC] text-[#98A2B3]"
                    )}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : <step.icon size={14} />}
                  </div>
                )}

                {/* Label under circle */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-[10px] font-bold leading-tight",
                      isActive ? "text-[#0F1C3F]" : "text-[#98A2B3]"
                    )}
                  >
                    {step.label}
                  </p>
                  {isActive && (
                    <p className="text-[9px] text-[#E8A020] font-semibold mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-1.5 mt-[-20px]">
                  <div className="h-[2px] bg-[#E4E7EC] rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full bg-[#E8A020] rounded-full transition-all duration-500",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { 
  Check, 
  BookOpen, 
  LayoutGrid, 
  Globe,
  Settings
} from "lucide-react";
import Link from "next/link";

interface Step {
  id: number;
  label: string;
  description: string;
  icon: any;
}

const steps: Step[] = [
  {
    id: 1,
    label: "Identitas",
    description: "Siapkan Kursus",
    icon: BookOpen
  },
  {
    id: 2,
    label: "Kurikulum",
    description: "Materi & Tes",
    icon: LayoutGrid
  },
  {
    id: 3,
    label: "Pengaturan",
    description: "Detail & Deadline",
    icon: Settings
  },
  {
    id: 4,
    label: "Publikasi",
    description: "Review & Live",
    icon: Globe
  }
];

interface CourseWizardProps {
  activeStep: number;
  courseId?: string;
}

export const CourseWizard = ({ activeStep, courseId }: CourseWizardProps) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-center max-w-4xl mx-auto px-4">
        {steps.map((step, index) => {
          const isCompleted = activeStep > step.id;
          const isActive = activeStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center relative z-10">
                  <Link 
                    href={courseId ? `/admin/courses/${courseId}?step=${step.id}` : "#"}
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm hover:scale-105 active:scale-95",
                      isCompleted && "bg-emerald-500 border-emerald-400 text-white shadow-emerald-100",
                      isActive && "bg-[#0F1C3F] border-[#0F1C3F] text-[#E8A020] shadow-lg shadow-[#0F1C3F]/20 scale-110",
                      !isCompleted && !isActive && "bg-white border-slate-200 text-slate-300"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </Link>
                
                <div className="absolute -bottom-9 w-28 text-center pointer-events-none">
                   <p className={cn(
                     "text-[10px] font-black uppercase tracking-widest",
                     isActive ? "text-[#0F1C3F]" : "text-slate-300"
                   )}>
                     {step.label}
                   </p>
                   <p className={cn(
                     "text-[9px] font-bold mt-0.5",
                     isActive ? "text-[#E8A020]" : "text-slate-200"
                   )}>
                     {step.description}
                   </p>
                </div>
              </div>

              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 px-4 mb-2">
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-primary transition-all duration-1000 ease-in-out",
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
      
      {/* Spacer for bottom labels */}
      <div className="h-8" />
    </div>
  );
};

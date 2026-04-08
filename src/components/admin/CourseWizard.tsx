"use client";

import { cn } from "@/lib/utils";
import { 
  Check, 
  BookOpen, 
  LayoutGrid, 
  Globe 
} from "lucide-react";

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
    description: "Nama & Judul",
    icon: BookOpen
  },
  {
    id: 2,
    label: "Kurikulum",
    description: "Modul & Tes",
    icon: LayoutGrid
  },
  {
    id: 3,
    label: "Publikasi",
    description: "Review & Live",
    icon: Globe
  }
];

interface CourseWizardProps {
  activeStep: number;
}

export const CourseWizard = ({ activeStep }: CourseWizardProps) => {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-center max-w-4xl mx-auto px-4">
        {steps.map((step, index) => {
          const isCompleted = activeStep > step.id;
          const isActive = activeStep === step.id;
          
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
                    isCompleted && "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200",
                    isActive && "bg-primary border-primary text-white shadow-primary/20 scale-110",
                    !isCompleted && !isActive && "bg-white border-slate-200 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                
                <div className="absolute -bottom-10 w-32 text-center pointer-events-none">
                   <p className={cn(
                     "text-xs font-black uppercase tracking-widest",
                     isActive ? "text-slate-800" : "text-slate-400"
                   )}>
                     {step.label}
                   </p>
                   <p className={cn(
                     "text-[10px] font-bold mt-0.5",
                     isActive ? "text-primary" : "text-slate-300"
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
      <div className="h-10" />
    </div>
  );
};

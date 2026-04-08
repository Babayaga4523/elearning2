"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { completeModule } from "@/actions/module";
import { cn } from "@/lib/utils";

interface ModuleCompletionButtonProps {
  courseId: string;
  moduleId: string;
  isCompleted: boolean;
  nextModuleId?: string;
}

export const ModuleCompletionButton = ({
  courseId,
  moduleId,
  isCompleted,
  nextModuleId,
}: ModuleCompletionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setIsLoading(true);
      await completeModule(moduleId, !isCompleted);
      
      toast.success("Progress updated");
      
      if (!isCompleted && nextModuleId) {
        router.push(`/courses/${courseId}/modules/${nextModuleId}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const Icon = isCompleted ? CheckCircle : Loader2;

  return (
    <Button
      onClick={onClick}
      disabled={isLoading || isCompleted}
      type="button"
      className={cn(
        "w-full h-12 text-md font-bold transition-all",
        isCompleted ? "bg-emerald-500 text-white" : "bg-primary hover:bg-primary/90 text-white"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
      ) : isCompleted ? (
        <><CheckCircle className="h-5 w-5 mr-2" /> Finished</>
      ) : "Complete Module"}
    </Button>
  );
}

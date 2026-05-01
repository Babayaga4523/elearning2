"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { togglePublishCourse } from "../actions";
import { Loader2 } from "lucide-react";

interface PublishButtonProps {
  courseId: string;
  isPublished: boolean;
  disabled: boolean;
}

export const PublishButton = ({
  courseId,
  isPublished,
  disabled
}: PublishButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      const result = await togglePublishCourse(courseId, isPublished);
      
      if (result.success) {
        toast.success(result.isPublished ? "Kursus berhasil dipublikasikan" : "Kursus ditarik dari publikasi");
        router.refresh();
      } else {
        toast.error(result.error || "Gagal mengubah status publikasi");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={onClick}
      disabled={disabled || isLoading}
      size="sm"
      className={cn(
        "font-black h-11 px-8 rounded-xl shadow-xl transition-all active:scale-95",
        isPublished ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {isPublished ? "Unpublish" : "Publish Sekarang"}
    </Button>
  );
};

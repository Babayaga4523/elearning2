"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { updateCourse } from "@/actions/course";
import { cn } from "@/lib/utils";

interface CourseVisibilityFormProps {
  initialData: {
    isVisible: boolean;
  };
  courseId: string;
}

export const CourseVisibilityForm = ({
  initialData,
  courseId
}: CourseVisibilityFormProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVisible, setIsVisible] = useState(initialData.isVisible);
  const router = useRouter();

  const onChange = async (checked: boolean) => {
    try {
      setIsUpdating(true);
      await updateCourse(courseId, { isVisible: checked });
      setIsVisible(checked);
      toast.success("Visibilitas kursus diperbarui");
      router.refresh();
    } catch {
      toast.error("Gagal memperbarui visibilitas");
      // Revert UI on failure
      setIsVisible(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 transition-all hover:bg-white hover:shadow-sm">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 flex items-center justify-center rounded-xl shadow-inner transition-all duration-500",
            isVisible ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500"
          )}>
            {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-black text-slate-800">Tampilkan di Katalog</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {isVisible ? "Kursus muncul di katalog karyawan" : "Hanya karyawan terdaftar yang bisa melihat"}
            </p>
          </div>
        </div>
        <Switch
          disabled={isUpdating}
          checked={isVisible}
          onCheckedChange={onChange}
        />
      </div>
      
      {!isVisible && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="h-5 w-5 flex items-center justify-center bg-amber-200 rounded-full shrink-0">
             <span className="text-[10px] font-black text-amber-700">!</span>
          </div>
          <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
            Kursus ini disembunyikan dari Katalog. Karyawan baru tidak akan menemukannya kecuali Anda mendaftarkan mereka secara manual.
          </p>
        </div>
      )}
    </div>
  );
};

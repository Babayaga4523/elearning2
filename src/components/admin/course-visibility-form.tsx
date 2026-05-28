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
    <div className="p-6 bg-white transition-all">
      <div className="font-bold text-sm text-[#101828] flex items-center justify-between font-['Lexend_Deca'] mb-4">
        Visibilitas Katalog
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 bg-[#F8F9FB] rounded-xl border border-[#E4E7EC] transition-all">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-300",
              isVisible ? "bg-[#EFF8FF] text-[#2E90FA]" : "bg-[#F1F3F7] text-[#98A2B3]"
            )}>
              {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-[#101828]">Tampilkan di Katalog</p>
              <p className="text-[10px] font-medium text-[#475467] uppercase tracking-wider font-['DM_Sans']">
                {isVisible ? "Kursus muncul di katalog karyawan" : "Hanya karyawan terdaftar yang bisa melihat"}
              </p>
            </div>
          </div>
          <Switch
            disabled={isUpdating}
            checked={isVisible}
            onCheckedChange={onChange}
            className="data-[state=checked]:bg-[#12B76A]"
          />
        </div>
        
        {!isVisible && (
          <div className="p-3 bg-[#FFFAEB] rounded-xl border border-[#FEC84B] flex gap-3">
            <div className="h-5 w-5 flex items-center justify-center bg-[#F79009] rounded-full shrink-0 text-white font-bold text-xs">
              !
            </div>
            <p className="text-[11px] font-medium text-[#B54708] leading-relaxed">
              Kursus ini disembunyikan dari Katalog. Karyawan baru tidak akan menemukannya kecuali Anda mendaftarkan mereka secara manual.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

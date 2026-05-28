"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock, Lock, CalendarPlus, Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateCourse } from "@/actions/course";
import { cn } from "@/lib/utils";

interface CourseDurationFormProps {
  initialData: {
    deadlineDuration: number | null;
    deadlineDate: Date | null;
    lockAfterDeadline: boolean;
    gracePeriodDays: number | null;
  };
  courseId: string;
}

const formSchema = z.object({
  deadlineDuration: z.coerce.number().min(0).optional().nullable(),
  deadlineDate: z.string().optional().or(z.literal("")),
  lockAfterDeadline: z.boolean().default(false),
  gracePeriodDays: z.coerce.number().min(0).max(30).optional().nullable(),
});

export const CourseDurationForm = ({
  initialData,
  courseId
}: CourseDurationFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deadlineDuration: initialData.deadlineDuration || 0,
      deadlineDate: initialData.deadlineDate 
        ? new Date(initialData.deadlineDate).toISOString().split('T')[0] 
        : "",
      lockAfterDeadline: initialData.lockAfterDeadline ?? false,
      gracePeriodDays: initialData.gracePeriodDays || 0,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Validate deadline date is not in the past
      if (values.deadlineDate) {
        const selectedDate = new Date(values.deadlineDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          toast.error("Tanggal deadline tidak boleh di masa lalu");
          return;
        }
      }

      // Validate grace period only if lock is enabled
      if (values.gracePeriodDays && !values.lockAfterDeadline) {
        toast.error("Grace period hanya berlaku jika 'Kunci Setelah Deadline' diaktifkan");
        return;
      }

      // Validate at least one deadline type is set
      if (!values.deadlineDuration && !values.deadlineDate) {
        toast.error("Harap atur minimal satu jenis deadline (Durasi atau Tanggal Pasti)");
        return;
      }

      const data = {
        deadlineDuration: values.deadlineDuration || null,
        deadlineDate: values.deadlineDate ? new Date(values.deadlineDate) : null,
        lockAfterDeadline: values.lockAfterDeadline,
        gracePeriodDays: values.gracePeriodDays || null,
      };

      await updateCourse(courseId, data);
      toast.success("Pengaturan deadline berhasil diperbarui");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  }

  return (
    <div className="p-6 bg-white transition-all">
      <div className="font-bold text-sm text-[#101828] flex items-center justify-between font-['Lexend_Deca']">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#0F1C3F]" />
          Batas Waktu (Deadline)
        </div>
        <Button onClick={toggleEdit} variant="ghost" className="h-8 text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828]">
          {isEditing ? (
            <>Batal</>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>
      
      {!isEditing && (
        <div className="mt-4 space-y-3 font-['DM_Sans']">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#F8F9FB] rounded-xl border border-[#E4E7EC] shadow-sm">
              <p className="text-[10px] font-bold uppercase text-[#98A2B3] tracking-wider mb-1">Durasi Relatif</p>
              <p className={cn("text-sm font-bold", !initialData.deadlineDuration ? "text-[#98A2B3] italic" : "text-[#101828]")}>
                {initialData.deadlineDuration ? `${initialData.deadlineDuration} Hari setelah pendaftaran` : "Tidak diatur"}
              </p>
            </div>
            <div className="p-3 bg-[#F8F9FB] rounded-xl border border-[#E4E7EC] shadow-sm">
              <p className="text-[10px] font-bold uppercase text-[#98A2B3] tracking-wider mb-1">Tanggal Pasti (Fixed)</p>
              <p className={cn("text-sm font-bold", !initialData.deadlineDate ? "text-[#98A2B3] italic" : "text-[#101828]")}>
                {initialData.deadlineDate 
                  ? new Date(initialData.deadlineDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) 
                  : "Tidak diatur"}
              </p>
            </div>
            <div className="p-3 bg-[#F8F9FB] rounded-xl border border-[#E4E7EC] shadow-sm">
              <p className="text-[10px] font-bold uppercase text-[#98A2B3] tracking-wider mb-1 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Kunci Setelah Deadline
              </p>
              <p className={cn("text-sm font-bold", !initialData.lockAfterDeadline ? "text-[#98A2B3] italic" : "text-[#F04438]")}>
                {initialData.lockAfterDeadline ? "AKTIF - Akses dikunci" : "Nonaktif"}
              </p>
            </div>
            <div className="p-3 bg-[#F8F9FB] rounded-xl border border-[#E4E7EC] shadow-sm">
              <p className="text-[10px] font-bold uppercase text-[#98A2B3] tracking-wider mb-1 flex items-center gap-1">
                <CalendarPlus className="h-3 w-3" />
                Grace Period
              </p>
              <p className={cn("text-sm font-bold", !initialData.gracePeriodDays ? "text-[#98A2B3] italic" : "text-[#E8A020]")}>
                {initialData.gracePeriodDays ? `${initialData.gracePeriodDays} Hari tambahan` : "Tidak ada"}
              </p>
            </div>
          </div>
          {initialData.deadlineDate && (
             <p className="text-[10px] font-bold text-[#F79009] italic">
               * Tanggal pasti sedang aktif dan akan mengabaikan durasi relatif.
             </p>
          )}
        </div>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="deadlineDuration"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-[10px] font-bold uppercase text-[#475467] mb-2">Durasi Deadline (Hari)</p>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Misal: 30"
                        disabled={isSubmitting}
                        className="bg-[#F8F9FB] border-[#E4E7EC] focus-visible:ring-1 focus-visible:ring-[#0F1C3F] h-10 font-medium"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] font-medium text-[#98A2B3]">
                      Jumlah hari bagi peserta untuk menyelesaikan kursus sejak mereka terdaftar.
                    </FormDescription>
                    <FormMessage className="text-xs text-[#F04438]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadlineDate"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-[10px] font-bold uppercase text-[#475467] mb-2">Tanggal Pasti (Global)</p>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isSubmitting}
                        className="bg-[#F8F9FB] border-[#E4E7EC] focus-visible:ring-1 focus-visible:ring-[#0F1C3F] h-10 font-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] font-medium text-[#98A2B3]">
                      Jika diisi, semua peserta wajib selesai pada tanggal ini (Mengabaikan durasi relatif).
                    </FormDescription>
                    <FormMessage className="text-xs text-[#F04438]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E4E7EC]">
              <FormField
                control={form.control}
                name="lockAfterDeadline"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-[#E4E7EC] p-4 bg-[#F8F9FB]">
                    <FormControl>
                      <input
                        id="lockAfterDeadline"
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-[#CBD2E0] text-[#0F1C3F] focus:ring-[#0F1C3F] mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <label htmlFor="lockAfterDeadline" className="text-sm font-bold text-[#101828] cursor-pointer">
                        Kunci Akses Setelah Deadline
                      </label>
                      <FormDescription className="text-[10px] font-medium text-[#98A2B3]">
                        Jika aktif, peserta tidak bisa mengakses kursus setelah deadline lewat.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gracePeriodDays"
                render={({ field }) => (
                  <FormItem>
                    <label htmlFor="gracePeriodDays" className="text-[10px] font-bold uppercase text-[#475467] mb-2 flex items-center gap-1 cursor-pointer">
                      <CalendarPlus className="h-3 w-3" />
                      Grace Period (Hari)
                    </label>
                    <FormControl>
                      <Input
                        id="gracePeriodDays"
                        type="number"
                        placeholder="Misal: 7"
                        disabled={isSubmitting || !form.watch("lockAfterDeadline")}
                        className="bg-[#F8F9FB] border-[#E4E7EC] focus-visible:ring-1 focus-visible:ring-[#0F1C3F] h-10 font-medium disabled:bg-[#E4E7EC]"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] font-medium text-[#98A2B3]">
                      Hari tambahan setelah deadline. Maksimal 30 hari (Dengan penalty tertentu).
                    </FormDescription>
                    <FormMessage className="text-xs text-[#F04438]" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-x-2 pt-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white rounded-lg h-9 text-xs font-semibold px-4"
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

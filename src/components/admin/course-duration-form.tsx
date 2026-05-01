"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock, Lock, CalendarPlus } from "lucide-react";
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
    <div className="mt-6 border bg-slate-50 rounded-2xl p-6 transition-all hover:shadow-md border-slate-200">
      <div className="font-bold flex items-center justify-between text-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Pengaturan Batas Waktu (Deadline)
        </div>
        <Button onClick={toggleEdit} variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 font-black text-xs uppercase tracking-widest">
          {isEditing ? (
            <>Batal</>
          ) : (
            <>Ubah Pengaturan</>
          )}
        </Button>
      </div>
      
      {!isEditing && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Durasi Relatif</p>
              <p className={cn("text-sm font-black", !initialData.deadlineDuration ? "text-slate-300 italic" : "text-slate-700")}>
                {initialData.deadlineDuration ? `${initialData.deadlineDuration} Hari setelah pendaftaran` : "Tidak diatur"}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Tanggal Pasti (Fixed)</p>
              <p className={cn("text-sm font-black", !initialData.deadlineDate ? "text-slate-300 italic" : "text-slate-700")}>
                {initialData.deadlineDate 
                  ? new Date(initialData.deadlineDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) 
                  : "Tidak diatur"}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Kunci Setelah Deadline
              </p>
              <p className={cn("text-sm font-black", !initialData.lockAfterDeadline ? "text-slate-300 italic" : "text-rose-600")}>
                {initialData.lockAfterDeadline ? "AKTIF - Akses dikunci setelah deadline" : "Nonaktif"}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                <CalendarPlus className="h-3 w-3" />
                Grace Period
              </p>
              <p className={cn("text-sm font-black", !initialData.gracePeriodDays ? "text-slate-300 italic" : "text-amber-600")}>
                {initialData.gracePeriodDays ? `${initialData.gracePeriodDays} Hari tambahan` : "Tidak ada grace period"}
              </p>
            </div>
          </div>
          {initialData.deadlineDate && (
             <p className="text-[10px] font-bold text-amber-500 italic">
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
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Durasi Deadline (Hari)</p>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Misal: 30"
                        disabled={isSubmitting}
                        className="bg-white rounded-xl h-12 font-bold"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-[9px] font-bold text-slate-400">
                      Jumlah hari bagi karyawan untuk menyelesaikan kursus sejak mereka terdaftar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadlineDate"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Tanggal Pasti (Global)</p>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isSubmitting}
                        className="bg-white rounded-xl h-12 font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[9px] font-bold text-slate-400">
                      Jika diisi, semua karyawan wajib selesai pada tanggal ini (Akan mengabaikan durasi hari).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <FormField
                control={form.control}
                name="lockAfterDeadline"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 p-4 bg-white">
                    <FormControl>
                      <input
                        id="lockAfterDeadline"
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <label htmlFor="lockAfterDeadline" className="text-sm font-black text-slate-700 cursor-pointer">
                        Kunci Akses Setelah Deadline
                      </label>
                      <FormDescription className="text-[9px] font-bold text-slate-400">
                        Jika aktif, karyawan tidak bisa mengakses kursus setelah deadline lewat (kecuali dalam grace period).
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
                    <label htmlFor="gracePeriodDays" className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center gap-1 cursor-pointer">
                      <CalendarPlus className="h-3 w-3" />
                      Grace Period (Hari)
                    </label>
                    <FormControl>
                      <Input
                        id="gracePeriodDays"
                        type="number"
                        placeholder="Misal: 7"
                        disabled={isSubmitting || !form.watch("lockAfterDeadline")}
                        className="bg-white rounded-xl h-12 font-bold disabled:bg-slate-100"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription className="text-[9px] font-bold text-slate-400">
                      Hari tambahan setelah deadline. Maksimal 30 hari. Karyawan tetap bisa akses tapi dengan penalty.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-x-2 pt-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                className="rounded-xl px-10 h-12 font-black shadow-lg shadow-primary/20"
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

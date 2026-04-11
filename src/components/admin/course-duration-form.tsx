"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Clock } from "lucide-react";
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
    deadlineDate: Date | null;
  };
  courseId: string;
}

const formSchema = z.object({
  deadlineDate: z.string().optional().or(z.literal("")),
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
      deadlineDate: initialData.deadlineDate 
        ? new Date(initialData.deadlineDate).toISOString().split('T')[0] 
        : "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convert empty string to null for Prisma
      const data = {
        deadlineDate: values.deadlineDate ? new Date(values.deadlineDate) : null
      };

      await updateCourse(courseId, data);
      toast.success("Deadline updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="mt-6 border bg-slate-50 rounded-2xl p-6 transition-all hover:shadow-md border-slate-200">
      <div className="font-bold flex items-center justify-between text-slate-700">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Batas Waktu Penyelesaian (Tanggal)
        </div>
        <Button onClick={toggleEdit} variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 font-black text-xs uppercase tracking-widest">
          {isEditing ? (
            <>Batal</>
          ) : (
            <>
              Ubah Tanggal
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-3 font-medium flex items-center gap-2",
          !initialData.deadlineDate ? "text-slate-400 italic" : "text-slate-700 font-black"
        )}>
          {initialData.deadlineDate 
            ? new Date(initialData.deadlineDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) 
            : "Belum diatur (Tanpa Deadline)"}
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="deadlineDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isSubmitting}
                      className="bg-white rounded-xl h-12 font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Tentukan tanggal batas akhir bagi semua peserta untuk menyelesaikan kursus ini. Kosongkan untuk tanpa batas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
                type="submit"
                className="rounded-xl px-8 font-black shadow-lg shadow-primary/20"
              >
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

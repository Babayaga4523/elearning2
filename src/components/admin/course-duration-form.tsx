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
    deadlineDuration: number | null;
  };
  courseId: string;
}

const formSchema = z.object({
  deadlineDuration: z.coerce.number().min(0, {
    message: "Duration must be 0 or more",
  }),
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
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateCourse(courseId, values);
      toast.success("Duration updated");
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
          Durasi Penyelesaian (Hari)
        </div>
        <Button onClick={toggleEdit} variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5 font-black text-xs uppercase tracking-widest">
          {isEditing ? (
            <>Batal</>
          ) : (
            <>
              Ubah Durasi
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-3 font-medium flex items-center gap-2",
          !initialData.deadlineDuration ? "text-slate-400 italic" : "text-slate-700 font-black"
        )}>
          {initialData.deadlineDuration 
            ? `${initialData.deadlineDuration} Hari` 
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
              name="deadlineDuration"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isSubmitting}
                      placeholder="Contoh: 7 (untuk 1 minggu)"
                      className="bg-white rounded-xl h-12 font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Tentukan berapa hari user harus menyelesaikan kursus ini setelah mereka mendaftar. (0 = Tanpa Limit)
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

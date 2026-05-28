"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Course } from "@/generated/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { updateCourse } from "@/actions/course";
import { cn } from "@/lib/utils";

interface CourseCategoryFormProps {
  initialData: Course;
  courseId: string;
  options: { label: string; value: string; }[];
}

const formSchema = z.object({
  categoryId: z.string().min(1),
});

export const CourseCategoryForm = ({
  initialData,
  courseId,
  options,
}: CourseCategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || ""
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateCourse(courseId, values);
      toast.success("Course updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  const selectedOption = options.find((option) => option.value === initialData.categoryId);

  return (
    <div className="p-6 bg-white transition-all">
      <div className="font-bold text-sm text-[#101828] flex items-center justify-between font-['Lexend_Deca']">
        Kategori Kursus
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
        <p className={cn(
          "text-sm mt-2 font-['DM_Sans']",
          !initialData.categoryId ? "text-[#98A2B3] italic" : "text-[#475467]"
        )}>
          {selectedOption?.label || "Belum ada kategori terpilih"}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <select
                      {...field}
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-lg border border-[#E4E7EC] bg-[#F8F9FB] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0F1C3F] disabled:cursor-not-allowed disabled:opacity-50 font-medium text-[#101828]"
                    >
                      <option value="">Pilih Kategori...</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-xs text-[#F04438]" />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
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

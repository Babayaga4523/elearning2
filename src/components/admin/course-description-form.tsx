"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Course } from "@/generated/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCourse } from "@/actions/course";
import { cn } from "@/lib/utils";

interface CourseDescriptionFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  description: z.string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(2000, "Deskripsi maksimal 2000 karakter")
    .trim()
    .refine(val => {
      // Check for XSS patterns
      const xssPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
      ];
      return !xssPatterns.some(pattern => pattern.test(val));
    }, {
      message: "Deskripsi mengandung karakter tidak valid atau berpotensi berbahaya"
    }),
});

export const CourseDescriptionForm = ({
  initialData,
  courseId
}: CourseDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || ""
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

  return (
    <div className="p-6 bg-white transition-all">
      <div className="font-bold text-sm text-[#101828] flex items-center justify-between font-['Lexend_Deca']">
        Deskripsi Kursus
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
          !initialData.description ? "text-[#98A2B3] italic" : "text-[#475467]"
        )}>
          {initialData.description || "Belum ada deskripsi"}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      disabled={isSubmitting}
                      placeholder="Contoh: Kursus ini mempelajari tentang..."
                      className="bg-[#F8F9FB] border-[#E4E7EC] focus-visible:ring-1 focus-visible:ring-[#0F1C3F] min-h-[120px]"
                      {...field}
                    />
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

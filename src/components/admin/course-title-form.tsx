"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateCourse } from "@/actions/course";

interface CourseTitleFormProps {
  initialData: {
    title: string;
  };
  courseId: string;
}

const formSchema = z.object({
  title: z.string()
    .min(3, "Judul minimal 3 karakter")
    .max(200, "Judul maksimal 200 karakter")
    .trim()
    .refine(val => {
      // Check for XSS patterns
      const xssPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // onclick, onerror, etc
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
      ];
      return !xssPatterns.some(pattern => pattern.test(val));
    }, {
      message: "Judul mengandung karakter tidak valid atau berpotensi berbahaya"
    })
    .refine(val => {
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(--|;|\/\*|\*\/)/g,
      ];
      return !sqlPatterns.some(pattern => pattern.test(val));
    }, {
      message: "Judul mengandung karakter yang tidak diizinkan"
    }),
});

export const CourseTitleForm = ({
  initialData,
  courseId
}: CourseTitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const toggleEdit = () => setIsEditing((current) => !current);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
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
        Judul Kursus
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
        <p className="text-sm mt-2 text-[#475467] font-['DM_Sans']">
          {initialData.title}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="Contoh: Pengenalan Budaya Perusahaan"
                      className="bg-[#F8F9FB] border-[#E4E7EC] focus-visible:ring-1 focus-visible:ring-[#0F1C3F]"
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

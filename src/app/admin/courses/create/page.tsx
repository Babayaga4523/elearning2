"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  BookPlus, 
  ArrowLeft, 
  Sparkles,
  Info
} from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createCourse } from "@/actions/course";
import { cn } from "@/lib/utils";
import { CourseWizard } from "@/components/admin/CourseWizard";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Judul kursus wajib diisi",
  }),
});

const CreatePage = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ""
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const course = await createCourse(values);
      toast.success("Kursus berhasil dibuat!");
      router.push(`/admin/courses/${course.id}`);
    } catch {
      toast.error("Terjadi kesalahan saat membuat kursus.");
    }
  }

  return ( 
    <div className="h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CourseWizard activeStep={1} />

        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 pt-10 pb-10 flex flex-col items-center text-center">
             <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-primary">
                <BookPlus className="h-8 w-8" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">
               Siapkan Kursus Baru
             </h1>
             <p className="text-slate-500 font-medium px-6 mt-2 max-w-sm">
               Mari kita beri nama yang menarik untuk kursus Anda. Anda bisa mengubahnya nanti.
             </p>
          </CardHeader>
          
          <CardContent className="p-8 md:p-12">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-black uppercase tracking-wider text-slate-400">
                          Judul Kursus
                        </FormLabel>
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Wajib Diisi
                        </span>
                      </div>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="Contoh: 'Pengenalan Budaya BNI Finance'"
                          className={cn(
                            "h-14 px-5 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/30 transition-all font-medium text-lg",
                            isSubmitting && "opacity-50"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="flex items-start gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-blue-600 font-medium text-xs leading-relaxed">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        Gunakan judul yang ringkas dan menjelaskan inti dari materi kursus Anda agar mudah dipahami karyawan.
                      </FormDescription>
                      <FormMessage className="font-bold text-red-500 pt-1" />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-50 mt-10">
                  <Link href="/admin/courses" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full sm:w-auto font-bold text-slate-500 hover:text-slate-800 h-14 px-8 rounded-2xl"
                    >
                      Batal
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="w-full flex-1 h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/25 hover:shadow-xl transition-all"
                  >
                    {isSubmitting ? "Sedang Membuat..." : "Lanjutkan ke Setup"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-50 underline decoration-primary/20 decoration-2 underline-offset-4">
          Langkah 1: Identitas Dasar Kursus
        </p>
      </div>
    </div>
   );
}
 
export default CreatePage;

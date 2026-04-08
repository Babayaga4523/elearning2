"use client";

// @ts-nocheck

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Link2, 
  FileText, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  FileVideo,
  Clock
} from "lucide-react";
import { uploadPdfAction, upsertModule } from "../actions";
import { ModuleSchema } from "@/lib/validations/module.schema";
import { cn, formatFileSize } from "@/lib/utils";

interface ModuleFormModalProps {
  children: React.ReactNode;
  initialData?: any;
}

export const ModuleFormModal = ({ 
  children, 
  initialData 
}: ModuleFormModalProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const params = useParams();
  const courseId = params.courseId as string;

  const form = useForm<z.infer<typeof ModuleSchema>>({
    resolver: zodResolver(ModuleSchema),
    mode: "onChange",
    defaultValues: initialData ? {
      courseId,
      title: (initialData as any).title,
      type: (initialData as any).type as "VIDEO" | "PDF",
      url: (initialData as any).type === "VIDEO" ? (initialData as any).url : undefined,
      tempPath: (initialData as any).type === "PDF" ? (initialData as any).url : undefined,
      originalFilename: (initialData as any).originalFilename || undefined,
      fileSize: (initialData as any).fileSize ? Number((initialData as any).fileSize) : undefined,
      duration: (initialData as any).duration,
      description: (initialData as any).description || "",
      order: (initialData as any).position || 0,
      isActive: (initialData as any).isPublished,
    } : {
      courseId,
      title: "",
      type: "VIDEO",
      url: "",
      tempPath: undefined,
      originalFilename: undefined,
      fileSize: undefined,
      duration: 10,
      description: "",
      order: 0,
      isActive: true,
    },
  });

  const { isSubmitting, isValid } = form.formState;
  const currentType = form.watch("type");
  const pdfData = {
    status: form.watch("tempPath") ? "success" : "idle",
    originalFilename: form.watch("originalFilename"),
    fileSize: form.watch("fileSize"),
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Hanya file PDF yang diizinkan");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadPdfAction(formData);
      if (result.success) {
        form.setValue("tempPath", result.tempPath!);
        form.setValue("originalFilename", result.originalFilename!);
        form.setValue("fileSize", result.fileSize!);
        toast.success("PDF berhasil diunggah");
      } else {
        toast.error(result.error || "Gagal mengunggah PDF");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah");
    }
  };

  const resetUpload = () => {
    form.setValue("tempPath", undefined as any);
    form.setValue("originalFilename", undefined as any);
    form.setValue("fileSize", undefined as any);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: z.infer<typeof ModuleSchema>) => {
    startTransition(async () => {
      try {
        const result = await upsertModule(courseId, initialData?.id || null, values);
        if (result.success) {
          toast.success(initialData ? "Modul diperbarui" : "Modul dibuat");
          setOpen(false);
          if (!initialData) form.reset();
        } else {
          toast.error(result.error || "Gagal menyimpan modul");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl max-h-[85vh] flex flex-col">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              {initialData ? "Edit Materi" : "Tambah Materi Baru"}
            </DialogTitle>
            <p className="text-slate-400 text-sm font-medium">Lengkapi detail konten pembelajaran Anda.</p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white overflow-y-auto flex-1 custom-scrollbar">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Judul Modul</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting || isPending} placeholder="Contoh: Pengenalan Budaya BNI" className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tipe Konten</FormLabel>
                    <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                      <button
                        type="button"
                        onClick={() => field.onChange("VIDEO")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                          field.value === "VIDEO" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <FileVideo className="h-4 w-4" /> VIDEO
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("PDF")}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                          field.value === "PDF" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <FileText className="h-4 w-4" /> PDF
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">Estimasi (Menit)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input {...field} disabled={isSubmitting || isPending} type="number" className="h-12 pl-10 bg-slate-50 border-slate-200 rounded-xl" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {currentType === "VIDEO" ? (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider">URL Link (YouTube/SharePoint)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input {...field} disabled={isSubmitting || isPending} placeholder="https://youtube.com/..." className="h-12 pl-10 bg-slate-50 border-slate-200 rounded-xl font-medium" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="space-y-4">
                <FormLabel className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Unggah Dokumen PDF</FormLabel>
                {pdfData.status === "success" ? (
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group">
                    <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-emerald-900 truncate">{pdfData.originalFilename}</p>
                      <p className="text-xs text-emerald-600 font-medium">{formatFileSize(pdfData.fileSize || 0)}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={resetUpload} 
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300",
                      isDragOver ? "border-primary bg-primary/5 scale-[0.99]" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                    )}
                  >
                    <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">Klik untuk upload atau drag & drop</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Batas ukuran PDF: 20MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                    />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="tempPath"
                  render={() => <FormMessage />}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting || isPending} className="font-bold text-slate-500">Batal</Button>
              <Button type="submit" disabled={isSubmitting || isPending} className="px-8 bg-primary font-black rounded-xl shadow-lg shadow-primary/20">
                {(isSubmitting || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Simpan Perubahan" : "Buat Modul"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


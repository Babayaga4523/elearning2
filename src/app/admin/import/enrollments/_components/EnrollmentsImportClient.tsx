"use client";

import React, { useState } from "react";
import { Download, GraduationCap, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExcelUploader } from "@/components/import/ExcelUploader";
import { ImportPreview } from "@/components/import/ImportPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function EnrollmentsImportClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sendNotification, setSendNotification] = useState(true);
  const [importResult, setImportResult] = useState<{
    count: number;
    errors: string[];
  } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/import/templates/enrollments");
      if (!response.ok) throw new Error("Download gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_enrollments.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template berhasil diunduh",
        description: "Silakan isi template dan upload kembali",
      });
    } catch (error) {
      toast({
        title: "Download gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (file: File) => {
    setUploadedFile(file);
    
    // For preview
    setPreviewData([
      { info: "File siap diimport", filename: file.name, size: `${(file.size / 1024).toFixed(2)} KB` }
    ]);
    setShowPreview(true);
  };

  const handleConfirmImport = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("sendNotification", sendNotification.toString());

      const response = await fetch("/api/admin/import/enrollments", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Import gagal");
      }

      setImportResult(result);

      toast({
        title: "Import berhasil!",
        description: `${result.count} enrollment berhasil dibuat${result.errors.length > 0 ? `, ${result.errors.length} gagal` : ""}`,
      });

      // Reset
      setShowPreview(false);
      setPreviewData([]);
      setUploadedFile(null);
    } catch (error) {
      toast({
        title: "Import gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData([]);
    setUploadedFile(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8 font-sans">
        <Link href="/admin/enrollments">
          <Button variant="ghost" size="sm" className="mb-4 h-10 px-4 rounded-lg hover:bg-[#F8F9FB] hover:text-[#0F1C3F] text-[#475467] font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#0F1C3F] shadow-sm rounded-xl">
            <GraduationCap className="h-8 w-8 text-[#E8A020]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#101828] font-lexend tracking-tight">
              Import Enrollment
            </h1>
            <p className="text-[14px] text-[#475467] font-medium mt-1">
              Upload file Excel untuk enrollment karyawan ke kursus secara massal
            </p>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6 font-sans">
          {/* Instructions */}
          <div className="p-5 bg-[#F8F9FB] border border-[#E4E7EC] rounded-xl shadow-sm">
            <h3 className="font-bold text-[#101828] font-lexend mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0F1C3F] text-[#E8A020] text-xs">?</span>
              Cara Import Enrollment:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[13px] font-medium text-[#475467] ml-2">
              <li>Download template Excel melalui tombol yang tersedia</li>
              <li>Isi template dengan User Email dan Course Title (harus exact match)</li>
              <li>Deadline opsional (format: YYYY-MM-DD), jika kosong akan otomatis 30 hari</li>
              <li>Upload file Excel yang sudah diisi</li>
              <li>Pilih apakah ingin mengirim notifikasi ke karyawan</li>
              <li>Review preview data dan konfirmasi import</li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-xl border border-[#E4E7EC] shadow-sm gap-4">
            <div>
              <p className="font-bold text-[#101828] font-lexend">
                Template Excel
              </p>
              <p className="text-[13px] font-medium text-[#475467] mt-0.5">
                Download template kosong untuk format kolom yang sesuai
              </p>
            </div>
            <Button onClick={handleDownloadTemplate} variant="outline" className="border-[#E4E7EC] hover:bg-[#F8F9FB] text-[#475467] font-bold h-10 px-5 rounded-lg shrink-0">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Notification Option */}
          <div className="flex items-center space-x-3 p-5 bg-white rounded-xl border border-[#E4E7EC] shadow-sm">
            <Checkbox
              id="notification"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
              className="data-[state=checked]:bg-[#0F1C3F] data-[state=checked]:border-[#0F1C3F]"
            />
            <label
              htmlFor="notification"
              className="text-[13px] font-bold text-[#101828] peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Kirim notifikasi ke karyawan tentang enrollment baru
            </label>
          </div>

          {/* Uploader */}
          <ExcelUploader
            onUpload={handleUpload}
            loading={loading}
          />

          {/* Import Result */}
          {importResult && (
            <div className={cn(
              "p-5 rounded-xl border space-y-3",
              importResult.errors.length > 0
                ? "bg-[#FFFAEB] border-[#FDB022]"
                : "bg-[#ECFDF3] border-[#A6F4C5]"
            )}>
              <h4 className={cn(
                "font-bold font-lexend flex items-center gap-2",
                importResult.errors.length > 0 ? "text-[#B54708]" : "text-[#05603A]"
              )}>
                {importResult.errors.length > 0 ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Import Selesai
              </h4>
              <p className={cn(
                "text-[13px] font-medium ml-7",
                importResult.errors.length > 0 ? "text-[#B54708]" : "text-[#05603A]"
              )}>
                <span className={cn(
                  "font-bold",
                  importResult.errors.length > 0 ? "text-[#93370D]" : "text-[#027A48]"
                )}>{importResult.count}</span> enrollment berhasil dibuat
              </p>
              {importResult.errors.length > 0 && (
                <div className="ml-7 pt-2 border-t border-[#FDB022]/50">
                  <details className="text-[13px] text-[#B54708] group">
                    <summary className="cursor-pointer font-bold hover:text-[#93370D] transition-colors flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      {importResult.errors.length} baris gagal (lihat detail)
                    </summary>
                    <ul className="mt-2 ml-4 space-y-1 max-h-40 overflow-y-auto bg-white/50 p-3 rounded-lg border border-[#FDB022]/30">
                      {importResult.errors.map((error, i) => (
                        <li key={i} className="font-medium">• {error}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <ImportPreview
          data={previewData}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelPreview}
          loading={loading}
          title="Preview Import Enrollment"
          description="File siap diimport. Klik konfirmasi untuk melanjutkan."
        />
      )}
    </div>
  );
}

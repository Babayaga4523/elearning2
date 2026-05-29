"use client";

import React, { useState } from "react";
import { Download, Users, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExcelUploader } from "@/components/import/ExcelUploader";
import { ImportPreview } from "@/components/import/ImportPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export function UsersImportClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [importResult, setImportResult] = useState<{
    count: number;
    skipped: number;
    skippedEmails: string[];
  } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/import/templates/users");
      if (!response.ok) throw new Error("Download gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_users.xlsx";
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
      formData.append("sendWelcomeEmail", sendWelcomeEmail.toString());

      const response = await fetch("/api/admin/import/users", {
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
        description: `${result.count} karyawan berhasil diimport${result.skipped > 0 ? `, ${result.skipped} dilewati (sudah ada)` : ""}`,
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
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="mb-4 h-10 px-4 rounded-lg hover:bg-[#F8F9FB] hover:text-[#0F1C3F] text-[#475467] font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#0F1C3F] shadow-sm rounded-xl">
            <Users className="h-8 w-8 text-[#E8A020]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#101828] font-lexend tracking-tight">
              Import Karyawan
            </h1>
            <p className="text-[14px] text-[#475467] font-medium mt-1">
              Upload file Excel untuk import karyawan secara massal
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
              Cara Import Karyawan:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[13px] font-medium text-[#475467] ml-2">
              <li>Download template Excel melalui tombol yang tersedia</li>
              <li>Isi template dengan data karyawan (Name, Email wajib diisi)</li>
              <li>Password akan di-generate otomatis jika tidak diisi</li>
              <li>Upload file Excel yang sudah diisi</li>
              <li>Pilih apakah ingin mengirim welcome email</li>
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

          {/* Welcome Email Option */}
          <div className="flex items-center space-x-3 p-5 bg-white rounded-xl border border-[#E4E7EC] shadow-sm">
            <Checkbox
              id="welcomeEmail"
              checked={sendWelcomeEmail}
              onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
              className="data-[state=checked]:bg-[#0F1C3F] data-[state=checked]:border-[#0F1C3F]"
            />
            <label
              htmlFor="welcomeEmail"
              className="text-[13px] font-bold text-[#101828] peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Kirim welcome email ke karyawan baru (berisi username & password)
            </label>
          </div>

          {/* Uploader */}
          <ExcelUploader
            onUpload={handleUpload}
            loading={loading}
          />

          {/* Import Result */}
          {importResult && (
            <div className="p-5 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl space-y-3">
              <h4 className="font-bold text-[#05603A] font-lexend flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Import Selesai
              </h4>
              <p className="text-[13px] font-medium text-[#05603A] ml-7">
                <span className="font-bold text-[#027A48]">{importResult.count}</span> karyawan berhasil diimport
              </p>
              {importResult.skipped > 0 && (
                <div className="ml-7 pt-2 border-t border-[#A6F4C5]/50">
                  <p className="text-[13px] font-medium text-[#B54708] flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-bold">{importResult.skipped}</span> karyawan dilewati (email sudah terdaftar)
                  </p>
                  {importResult.skippedEmails.length > 0 && (
                    <details className="text-[13px] text-[#B54708] mt-2 group">
                      <summary className="cursor-pointer font-bold hover:text-[#93370D] transition-colors">
                        Lihat email yang dilewati
                      </summary>
                      <ul className="mt-2 ml-4 space-y-1 bg-[#FEF3F2]/50 p-3 rounded-lg border border-[#FECDCA]">
                        {importResult.skippedEmails.map((email, i) => (
                          <li key={i} className="font-medium">• {email}</li>
                        ))}
                      </ul>
                    </details>
                  )}
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
          title="Preview Import Karyawan"
          description="File siap diimport. Klik konfirmasi untuk melanjutkan."
        />
      )}
    </div>
  );
}

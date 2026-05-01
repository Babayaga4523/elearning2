"use client";

import React, { useState } from "react";
import { Download, GraduationCap, ArrowLeft } from "lucide-react";
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
      <div className="mb-8">
        <Link href="/admin/enrollments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <GraduationCap className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Import Enrollment
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Upload file Excel untuk enrollment karyawan ke kursus secara massal
            </p>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Cara Import Enrollment:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Download template Excel</li>
              <li>Isi template dengan User Email dan Course Title (harus exact match)</li>
              <li>Deadline opsional (format: YYYY-MM-DD), jika kosong akan otomatis 30 hari</li>
              <li>Upload file Excel yang sudah diisi</li>
              <li>Pilih apakah ingin mengirim notifikasi ke karyawan</li>
              <li>Konfirmasi import</li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Template Excel
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Download template untuk format yang benar
              </p>
            </div>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Notification Option */}
          <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Checkbox
              id="notification"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
            />
            <label
              htmlFor="notification"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
            <div className={`p-4 rounded-lg border space-y-2 ${
              importResult.errors.length > 0
                ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            }`}>
              <h4 className={`font-semibold ${
                importResult.errors.length > 0
                  ? "text-yellow-800 dark:text-yellow-200"
                  : "text-green-800 dark:text-green-200"
              }`}>
                Import Selesai
              </h4>
              <p className={`text-sm ${
                importResult.errors.length > 0
                  ? "text-yellow-700 dark:text-yellow-300"
                  : "text-green-700 dark:text-green-300"
              }`}>
                ✓ {importResult.count} enrollment berhasil dibuat
              </p>
              {importResult.errors.length > 0 && (
                <details className="text-sm text-yellow-700 dark:text-yellow-300">
                  <summary className="cursor-pointer font-medium">
                    ⚠ {importResult.errors.length} baris gagal (lihat detail)
                  </summary>
                  <ul className="mt-2 ml-4 space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </details>
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

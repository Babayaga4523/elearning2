"use client";

import React, { useState } from "react";
import { Download, Users, ArrowLeft } from "lucide-react";
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
      <div className="mb-8">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Import Karyawan
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Upload file Excel untuk import karyawan secara massal
            </p>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Cara Import Karyawan:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Download template Excel</li>
              <li>Isi template dengan data karyawan (Name, Email wajib diisi)</li>
              <li>Password akan di-generate otomatis jika tidak diisi</li>
              <li>Upload file Excel yang sudah diisi</li>
              <li>Pilih apakah ingin mengirim welcome email</li>
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

          {/* Welcome Email Option */}
          <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Checkbox
              id="welcomeEmail"
              checked={sendWelcomeEmail}
              onCheckedChange={(checked) => setSendWelcomeEmail(checked as boolean)}
            />
            <label
              htmlFor="welcomeEmail"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Import Selesai
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ {importResult.count} karyawan berhasil diimport
              </p>
              {importResult.skipped > 0 && (
                <>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ⚠ {importResult.skipped} karyawan dilewati (email sudah terdaftar)
                  </p>
                  {importResult.skippedEmails.length > 0 && (
                    <details className="text-sm text-green-700 dark:text-green-300">
                      <summary className="cursor-pointer font-medium">
                        Lihat email yang dilewati
                      </summary>
                      <ul className="mt-2 ml-4 space-y-1">
                        {importResult.skippedEmails.map((email, i) => (
                          <li key={i}>• {email}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
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

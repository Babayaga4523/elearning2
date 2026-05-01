"use client";

import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExcelUploader } from "@/components/import/ExcelUploader";
import { ImportPreview } from "@/components/import/ImportPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Test {
  id: string;
  title: string;
  courseTitle: string;
}

export function QuestionsImportClient() {
  const { toast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Fetch tests
  useEffect(() => {
    async function fetchTests() {
      try {
        const response = await fetch("/api/admin/tests");
        if (response.ok) {
          const data = await response.json();
          setTests(data);
        }
      } catch (error) {
        console.error("Failed to fetch tests:", error);
      }
    }
    fetchTests();
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/import/templates/questions");
      if (!response.ok) throw new Error("Download gagal");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_questions.xlsx";
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
    if (!selectedTestId) {
      toast({
        title: "Pilih test terlebih dahulu",
        variant: "destructive",
      });
      throw new Error("Test belum dipilih");
    }

    setUploadedFile(file);
    
    // Parse file for preview
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // For preview, we'll just show basic info
      // In production, you might want a separate preview endpoint
      setPreviewData([
        { info: "File siap diimport", filename: file.name, size: `${(file.size / 1024).toFixed(2)} KB` }
      ]);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Gagal membaca file",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleConfirmImport = async () => {
    if (!uploadedFile || !selectedTestId) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("testId", selectedTestId);

      const response = await fetch("/api/admin/import/questions", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Import gagal");
      }

      toast({
        title: "Import berhasil!",
        description: `${result.count} soal berhasil diimport`,
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
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <FileSpreadsheet className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Import Soal
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Upload file Excel untuk import soal secara massal
            </p>
          </div>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Cara Import Soal:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Pilih test tujuan dari dropdown</li>
              <li>Download template Excel (opsional)</li>
              <li>Isi template dengan data soal</li>
              <li>Upload file Excel yang sudah diisi</li>
              <li>Review preview dan konfirmasi import</li>
            </ol>
          </div>

          {/* Test Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pilih Test <span className="text-red-500">*</span>
            </label>
            <Select value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih test..." />
              </SelectTrigger>
              <SelectContent>
                {tests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.title} - {test.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Uploader */}
          <ExcelUploader
            onUpload={handleUpload}
            loading={loading}
            disabled={!selectedTestId}
          />
        </div>
      ) : (
        <ImportPreview
          data={previewData}
          onConfirm={handleConfirmImport}
          onCancel={handleCancelPreview}
          loading={loading}
          title="Preview Import Soal"
          description="File siap diimport. Klik konfirmasi untuk melanjutkan."
        />
      )}
    </div>
  );
}

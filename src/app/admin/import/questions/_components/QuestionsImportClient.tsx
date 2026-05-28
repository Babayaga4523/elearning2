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
      <div className="mb-8 font-sans">
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm" className="mb-4 h-10 px-4 rounded-lg hover:bg-[#F8F9FB] hover:text-[#0F1C3F] text-[#475467] font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-[#0F1C3F] shadow-sm rounded-xl">
            <FileSpreadsheet className="h-8 w-8 text-[#E8A020]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#101828] font-lexend tracking-tight">
              Import Soal
            </h1>
            <p className="text-[14px] text-[#475467] font-medium mt-1">
              Upload file Excel untuk import soal secara massal
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
              Cara Import Soal:
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-[13px] font-medium text-[#475467] ml-2">
              <li>Pilih test tujuan dari dropdown di bawah</li>
              <li>Download template Excel melalui tombol yang tersedia</li>
              <li>Isi template dengan data soal sesuai format</li>
              <li>Upload file Excel yang sudah diisi</li>
              <li>Review preview data dan konfirmasi import</li>
            </ol>
          </div>

          {/* Test Selector */}
          <div className="space-y-2.5">
            <label className="text-[13px] font-bold text-[#101828] uppercase tracking-wider">
              Pilih Test <span className="text-[#B42318]">*</span>
            </label>
            <Select value={selectedTestId} onValueChange={setSelectedTestId}>
              <SelectTrigger className="h-12 bg-white border-[#E4E7EC] rounded-xl font-medium text-[#101828] focus:ring-[#0F1C3F] focus:border-[#0F1C3F]">
                <SelectValue placeholder="Pilih test..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E4E7EC] shadow-md font-sans">
                {tests.map((test) => (
                  <SelectItem key={test.id} value={test.id} className="font-medium focus:bg-[#F8F9FB] focus:text-[#0F1C3F]">
                    {test.title} - {test.courseTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

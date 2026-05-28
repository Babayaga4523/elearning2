"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ExcelUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
  loading?: boolean;
  disabled?: boolean;
}

export function ExcelUploader({
  onUpload,
  accept = ".xlsx,.xls",
  maxSize = 5 * 1024 * 1024, // 5MB default
  loading = false,
  disabled = false,
}: ExcelUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return "File harus berformat Excel (.xlsx atau .xls)";
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `Ukuran file maksimal ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    },
    [maxSize]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || loading) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, loading, handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled || loading) return;

      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled, loading, handleFile]
  );

  const handleUpload = async () => {
    if (!selectedFile || loading || disabled) return;

    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await onUpload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  };

  const fileSizeMB = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : "0";

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 font-sans",
          dragActive
            ? "border-[#1A56DB] bg-[#EFF6FF]"
            : "border-[#E4E7EC] hover:border-[#98A2B3] bg-[#F8F9FB] hover:bg-[#F0F2F7]",
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          !selectedFile && "cursor-pointer"
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          {!selectedFile ? (
            <>
              <div className="p-4 bg-white border border-[#E4E7EC] shadow-sm rounded-full mb-2">
                <Upload className="h-8 w-8 text-[#0F1C3F]" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#101828] font-lexend tracking-tight">
                  Drag & drop file Excel di sini
                </p>
                <p className="text-sm font-medium text-[#475467] mt-1">
                  atau klik untuk memilih file
                </p>
              </div>
              <p className="text-xs font-bold text-[#98A2B3] uppercase tracking-wider mt-2">
                Format: .xlsx, .xls (Maks. {(maxSize / (1024 * 1024)).toFixed(0)}MB)
              </p>
            </>
          ) : (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between p-4 bg-white border border-[#E4E7EC] shadow-sm rounded-xl">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-2 bg-[#ECFDF3] rounded-lg">
                    <FileSpreadsheet className="h-6 w-6 text-[#027A48] shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-[#101828] font-lexend truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] font-bold text-[#98A2B3] uppercase tracking-wider mt-0.5">
                      {fileSizeMB} MB
                    </p>
                  </div>
                </div>
                {!loading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemove}
                    className="shrink-0 h-8 w-8 text-[#475467] hover:bg-[#FEF3F2] hover:text-[#B42318] rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2 bg-[#F8F9FB]" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-center text-[#475467]">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadProgress === 100 && (
                <div className="flex items-center justify-center space-x-2 text-[#027A48] bg-[#ECFDF3] py-2 px-4 rounded-lg mx-auto w-fit">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-bold font-lexend">Upload berhasil!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-3 p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl font-sans">
          <AlertCircle className="h-5 w-5 text-[#B42318] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#B42318] font-lexend">Error</p>
            <p className="text-[13px] font-medium text-[#B42318] mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !loading && uploadProgress === 0 && (
        <Button
          onClick={handleUpload}
          disabled={disabled || loading}
          className="w-full bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white font-bold h-12 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          size="lg"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload & Import
        </Button>
      )}
    </div>
  );
}

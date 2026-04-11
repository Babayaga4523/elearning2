"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ExportButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onExport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/analytics/export");

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BNI_Finance_LMS_Report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Laporan berhasil diunduh (CSV).");
    } catch {
      toast.error("Gagal mengekspor data. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={onExport}
      disabled={isLoading}
      className="h-10 gap-2 rounded-xl border-0 px-5 font-black text-white shadow-md transition-all hover:brightness-110"
      style={{
        background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
        boxShadow: "0 4px 16px rgba(15,28,63,0.25)",
      }}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <FileDown className="h-4 w-4 text-[#E8A020]" />
      )}
      Export CSV
    </Button>
  );
};

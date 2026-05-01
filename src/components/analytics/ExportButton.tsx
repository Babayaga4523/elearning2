"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      toast.loading("Menyiapkan laporan CSV...");
      
      // Navigate to the API route to trigger download
      window.location.href = "/api/analytics/export";
      
      setTimeout(() => {
        setIsLoading(false);
        toast.dismiss();
        toast.success("Laporan berhasil diunduh.");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh laporan.");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2 border-slate-200 hover:bg-slate-50 transition-all font-semibold"
    >
      <Download className="h-4 w-4" />
      {isLoading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}

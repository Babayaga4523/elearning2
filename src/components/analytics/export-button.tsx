"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

export const ExportButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onExport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/analytics/export");
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Handle the blob response from the Route Handler
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BNI_Finance_LMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={onExport}
      disabled={isLoading}
      className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Export HR Report (CSV)
    </Button>
  );
};

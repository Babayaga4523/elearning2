"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-hot-toast";

interface ExportTranscriptButtonProps {
  data: any;
  userName: string;
}

export const ExportTranscriptButton = ({ data, userName }: ExportTranscriptButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      // 1. HEADER (Brand Background)
      doc.setFillColor(15, 28, 63); // Dark Blue
      doc.rect(0, 0, pageWidth, 35, "F");
      
      // BNI Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("BNI", margin, 20);
      doc.setTextColor(232, 160, 32); 
      doc.text("finance", margin + 17, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("Corporate Learning Management System", margin, 28);
      
      // Right side text
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("OFFICIAL TRANSCRIPT", pageWidth - margin, 20, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(232, 160, 32);
      doc.text("Dokumen Rahasia & Terotorisasi", pageWidth - margin, 26, { align: "right" });

      // 2. DOCUMENT TITLE & EMPLOYEE INFO
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 28, 63);
      doc.text("LAPORAN PERFORMA AKADEMIK", margin, 50);

      // Info Block background
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, 55, pageWidth - margin * 2, 22, 2, 2, "FD");

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("NAMA KARYAWAN", margin + 5, 62);
      doc.text("NIP / ID", margin + 70, 62);
      doc.text("DEPARTEMEN", margin + 120, 62);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 28, 63);
      doc.text(data.user.name.toUpperCase(), margin + 5, 70);
      doc.text(data.user.nip || "-", margin + 70, 70);
      doc.text(data.user.department?.toUpperCase() || "-", margin + 120, 70);

      // 3. PERFORMANCE STATS BOXES
      doc.setFontSize(11);
      doc.text("STATISTIK KELULUSAN", margin, 90);

      const boxY = 95;
      
      // Avg Score Box (Dark)
      doc.setFillColor(15, 28, 63);
      doc.roundedRect(margin, boxY, 55, 22, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("RATA-RATA SKOR", margin + 5, boxY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(232, 160, 32); 
      doc.text(`${data.summary.averageScore}%`, margin + 5, boxY + 17);

      // Completed Box (Dark)
      doc.setFillColor(15, 28, 63);
      doc.roundedRect(margin + 62, boxY, 55, 22, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("KURSUS SELESAI", margin + 67, boxY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(232, 160, 32);
      doc.text(`${data.summary.completedCourses}`, margin + 67, boxY + 17);

      // Pass Rate Box (Dark)
      const passingRate = data.summary.totalTestsTaken > 0 ? Math.round((data.summary.totalTestsPassed / data.summary.totalTestsTaken) * 100) : 0;
      doc.setFillColor(15, 28, 63);
      doc.roundedRect(margin + 124, boxY, 56, 22, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("TINGKAT KELULUSAN", margin + 129, boxY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(232, 160, 32);
      doc.text(`${passingRate}%`, margin + 129, boxY + 17);

      // 4. DETAILED COURSE TABLE
      doc.setFontSize(11);
      doc.text("RINCIAN KOMPETENSI", margin, 132);

      const tableData = data.courseAnalysis.map((course: any, index: number) => [
        index + 1,
        course.title,
        course.category,
        course.preScore !== null ? `${course.preScore}%` : "-",
        course.postScore !== null ? `${course.postScore}%` : "-",
        course.growth !== null ? (course.growth > 0 ? `+${course.growth}%` : `${course.growth}%`) : "-",
        course.status === "COMPLETED" ? "LULUS" : 
        course.status === "CHEATING" ? "KECURANGAN" : 
        course.status === "FAILED" ? "GAGAL" : "IN PROGRESS"
      ]);

      autoTable(doc, {
        startY: 137,
        head: [["NO", "NAMA KURSUS", "KATEGORI", "PRE", "POST", "GROWTH", "STATUS AKHIR"]],
        body: tableData,
        theme: "plain",
        headStyles: {
          fillColor: [15, 28, 63],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [51, 65, 85], // slate-700
          lineWidth: 0.1,
          lineColor: [226, 232, 240]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: "auto", fontStyle: "bold", textColor: [15, 28, 63] },
          2: { cellWidth: 28, halign: "center" },
          3: { cellWidth: 16, halign: "center" },
          4: { cellWidth: 16, halign: "center" },
          5: { cellWidth: 20, halign: "center" },
          6: { cellWidth: 28, halign: "center", fontStyle: "bold" }
        },
        willDrawCell: function (dataContext) {
           // Color Statuses conditionally
           if (dataContext.section === "body" && dataContext.column.index === 6) {
              const statusStr = dataContext.cell.raw;
              if (statusStr === "KECURANGAN" || statusStr === "GAGAL") {
                dataContext.cell.styles.textColor = [239, 68, 68]; // Red
              } else if (statusStr === "LULUS") {
                dataContext.cell.styles.textColor = [16, 185, 129]; // Emerald
              } else {
                dataContext.cell.styles.textColor = [232, 160, 32]; // Amber
              }
           }
           // Color Growth conditionally
           if (dataContext.section === "body" && dataContext.column.index === 5) {
              const growthStr = dataContext.cell.raw as string;
              if (growthStr.includes("+")) {
                dataContext.cell.styles.textColor = [16, 185, 129];
              } else if (growthStr.includes("-") && growthStr !== "-") {
                dataContext.cell.styles.textColor = [239, 68, 68];
              }
           }
        },
        margin: { left: margin, right: margin }
      });

      // 5. FOOTER & AUTHENTICITY
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, 280, pageWidth - margin, 280);
        
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Dokumen ini dicetak otomatis oleh LMS BNI Finance pada ${new Date().toLocaleString("id-ID")}.`,
          margin,
          285
        );
        doc.text(
          `Validasi Digital ID: BNIF-TRX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          margin,
          289
        );
        
        doc.setFont("helvetica", "normal");
        doc.text(
          `Halaman ${i} / ${pageCount}`,
          pageWidth - margin,
          285,
          { align: "right" }
        );
      }

      doc.save(`Transkrip_BNIF_${data.user.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("Transkrip berhasil diunduh.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleExport}
      disabled={isGenerating}
      className={cn(
        "bg-[#f7941d] hover:bg-opacity-90 text-white font-medium text-sm py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2",
        isGenerating && "opacity-80 cursor-not-allowed"
      )}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isGenerating ? "Processing..." : "Unduh Transkrip"}
    </Button>
  );
};

// Helper for class merging inside client component
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
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

      // 1. Header & Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("BNIF LMS", margin, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text("Learning Management System - BNI Finance", margin, 26);

      // Divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, 32, pageWidth - margin, 32);

      // 2. Document Title & Employee Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("TRANSKRIP NILAI KARYAWAN", margin, 45);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Identitas Karyawan", margin, 55);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Nama: ${data.user.name}`, margin, 60);
      doc.text(`NIP: ${data.user.nip}`, margin, 65);
      doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 70);

      // 3. Performance Summary
      doc.setFont("helvetica", "bold");
      doc.text("Ringkasan Performa", margin, 85);
      
      // Summary Boxes (Simplified layout for PDF)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(margin, 90, 50, 20, 2, 2, "F");
      doc.roundedRect(margin + 55, 90, 50, 20, 2, 2, "F");
      doc.roundedRect(margin + 110, 90, 50, 20, 2, 2, "F");

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("RATA-RATA SKOR", margin + 5, 96);
      doc.text("KURSUS SELESAI", margin + 60, 96);
      doc.text("TINGKAT LULUS", margin + 115, 96);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${data.summary.averageScore}%`, margin + 5, 104);
      doc.text(`${data.summary.completedCourses}`, margin + 60, 104);
      const passingRate = data.summary.totalTestsTaken > 0 ? Math.round((data.summary.totalTestsPassed / data.summary.totalTestsTaken) * 100) : 0;
      doc.text(`${passingRate}%`, margin + 115, 104);

      // 4. Detailed Course Table
      doc.setFontSize(10);
      doc.text("Detail Kompetensi Kursus", margin, 120);

      const tableData = data.courseAnalysis.map((course: any, index: number) => [
        index + 1,
        course.title,
        course.category,
        course.preScore !== null ? `${course.preScore}%` : "-",
        course.postScore !== null ? `${course.postScore}%` : "-",
        course.growth !== null ? (course.growth >= 0 ? `+${course.growth}%` : `${course.growth}%`) : "-",
        course.status === "COMPLETED" ? "LULUS" : "IN PROGRESS"
      ]);

      (doc as any).autoTable({
        startY: 125,
        head: [["No", "Nama Kursus", "Kategori", "Pre-Test", "Post-Test", "Growth", "Status"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 30 },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 20, halign: "center" },
          5: { cellWidth: 20, halign: "center" },
          6: { cellWidth: 25, halign: "center" }
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        margin: { left: margin, right: margin }
      });

      // 5. Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Halaman ${i} dari ${pageCount} - BNIF Learning Management System Transkrip`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`Transkrip_Nilai_${data.user.name.replace(/\s+/g, '_')}.pdf`);
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
        "bg-white hover:bg-slate-50 text-slate-950 font-black rounded-2xl h-12 px-6 shadow-md border-0 flex items-center gap-2 transition-all active:scale-95",
        isGenerating && "opacity-80"
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

"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ImportPreviewProps {
  data: Record<string, any>[];
  errors?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function ImportPreview({
  data,
  errors = [],
  onConfirm,
  onCancel,
  loading = false,
  title = "Preview Data Import",
  description = "Periksa data sebelum melakukan import",
}: ImportPreviewProps) {
  const hasErrors = errors.length > 0;
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-[#101828] font-lexend tracking-tight">
          {title}
        </h3>
        <p className="text-[13px] font-medium text-[#475467] mt-1">
          {description}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#E4E7EC] shadow-sm rounded-xl flex items-center gap-4">
          <div className="p-2.5 bg-[#F8F9FB] rounded-lg border border-[#E4E7EC]">
            <Info className="h-5 w-5 text-[#0F1C3F]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
              Total Baris
            </p>
            <p className="text-2xl font-bold text-[#101828] font-lexend mt-0.5">
              {data.length}
            </p>
          </div>
        </div>

        <div className={cn(
          "p-4 border rounded-xl flex items-center gap-4",
          hasErrors
            ? "bg-[#FEF3F2] border-[#FECDCA]"
            : "bg-[#ECFDF3] border-[#A6F4C5]"
        )}>
          <div className={cn(
            "p-2.5 rounded-lg",
            hasErrors ? "bg-white/60" : "bg-white/60"
          )}>
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-[#B42318]" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[#027A48]" />
            )}
          </div>
          <div>
            <p className={cn(
              "text-[11px] font-bold uppercase tracking-wider",
              hasErrors ? "text-[#B42318]" : "text-[#027A48]"
            )}>
              Status
            </p>
            <p className={cn(
              "text-2xl font-bold font-lexend mt-0.5",
              hasErrors ? "text-[#912018]" : "text-[#05603A]"
            )}>
              {hasErrors ? "Error" : "Valid"}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E4E7EC] shadow-sm rounded-xl flex items-center gap-4">
          <div className="p-2.5 bg-[#F8F9FB] rounded-lg border border-[#E4E7EC]">
            <Info className="h-5 w-5 text-[#0F1C3F]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
              Kolom
            </p>
            <p className="text-2xl font-bold text-[#101828] font-lexend mt-0.5">
              {columns.length}
            </p>
          </div>
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="p-4 bg-[#FEF3F2] border border-[#FECDCA] rounded-xl space-y-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-[#B42318]" />
            <h4 className="font-bold text-[#912018] font-lexend">
              Ditemukan {errors.length} Error
            </h4>
          </div>
          <ScrollArea className="h-32">
            <ul className="space-y-1.5 text-[13px] font-medium text-[#B42318] pl-7">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 mt-1 shrink-0 h-1.5 w-1.5 rounded-full bg-[#B42318]" />
                  <span className="leading-relaxed">{error}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {/* Data Table */}
      {data.length > 0 && (
        <div className="border border-[#E4E7EC] rounded-xl overflow-hidden shadow-sm bg-white">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8F9FB] border-b border-[#E4E7EC] hover:bg-[#F8F9FB]">
                  <TableHead className="w-12 text-[#475467] font-bold uppercase tracking-wider text-[11px] py-3">#</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column} className="text-[#475467] font-bold uppercase tracking-wider text-[11px] py-3">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} className="hover:bg-[#F8F9FB] border-b border-[#E4E7EC] transition-colors">
                    <TableCell className="font-bold text-[#101828]">
                      {index + 1}
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column} className="text-[13px] font-medium text-[#475467]">
                        {row[column]?.toString() || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-[#E4E7EC] text-[#475467] font-bold hover:bg-[#F8F9FB] rounded-lg px-5 h-10"
        >
          Batal
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading || hasErrors || data.length === 0}
          className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white font-bold rounded-lg px-5 h-10 shadow-sm transition-all active:scale-95"
        >
          {loading ? "Importing..." : `Konfirmasi Import (${data.length} baris)`}
        </Button>
      </div>
    </div>
  );
}

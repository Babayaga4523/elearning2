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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Total Baris
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {data.length}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(
          "p-4 border rounded-lg",
          hasErrors
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        )}>
          <div className="flex items-center space-x-2">
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            <div>
              <p className={cn(
                "text-xs font-medium",
                hasErrors
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              )}>
                Status
              </p>
              <p className={cn(
                "text-2xl font-bold",
                hasErrors
                  ? "text-red-700 dark:text-red-300"
                  : "text-green-700 dark:text-green-300"
              )}>
                {hasErrors ? "Error" : "Valid"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Kolom
              </p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {columns.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-800 dark:text-red-200">
              Ditemukan {errors.length} Error
            </h4>
          </div>
          <ScrollArea className="h-32">
            <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-red-500 dark:text-red-400">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {/* Data Table */}
      {data.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 bg-gray-50 dark:bg-gray-800">#</TableHead>
                  {columns.map((column) => (
                    <TableHead key={column} className="bg-gray-50 dark:bg-gray-800">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column}>
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
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading || hasErrors || data.length === 0}
        >
          {loading ? "Importing..." : `Konfirmasi Import (${data.length} baris)`}
        </Button>
      </div>
    </div>
  );
}

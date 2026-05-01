/**
 * excel-template.ts
 * Shared ExcelJS template utilities for BNI Finance E-Learning admin exports.
 * All admin export pages MUST use these helpers to ensure consistent branding.
 */

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ─── Brand Colors (ARGB format for ExcelJS) ────────────────────────────────
export const BRAND = {
  NAVY: "FF0F1C3F",     // Primary navy — title background
  GOLD: "FFE8A020",     // Gold — header row background
  WHITE: "FFFFFFFF",
  ZEBRA: "FFF5F7FA",    // Light blue-grey — alternating row
  BORDER: "FFE2E6F0",   // Subtle border color
  TEXT_MUTED: "FF9AAABF",
  // Status colors
  STATUS_COMPLETED_BG: "FFDCFCE7",
  STATUS_COMPLETED_FG: "FF166534",
  STATUS_FAILED_BG: "FFFEE2E2",
  STATUS_FAILED_FG: "FF991B1B",
  STATUS_PROGRESS_BG: "FFDBEAFE",
  STATUS_PROGRESS_FG: "FF1D4ED8",
  STATUS_PENDING_BG: "FFFEF9C3",
  STATUS_PENDING_FG: "FF854D0E",
  STATUS_REJECTED_BG: "FFF1F5F9",
  STATUS_REJECTED_FG: "FF64748B",
  STATUS_CHEATING_BG: "FFFEE2E2",
  STATUS_CHEATING_FG: "FFB91C1C",
};

// ─── Workbook Factory ───────────────────────────────────────────────────────

/**
 * Creates a new ExcelJS workbook with BNI Finance metadata.
 */
export function createWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "HCMS E-Learning — BNI Finance";
  wb.lastModifiedBy = "HCMS E-Learning — BNI Finance";
  wb.created = new Date();
  wb.modified = new Date();
  return wb;
}

// ─── Row Stylers ───────────────────────────────────────────────────────────

/**
 * Styles a full-width title row (row 1).
 * Merges cells 1..colCount, applies NAVY background with white bold text.
 */
export function styleTitle(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  title: string,
  colCount: number
): void {
  sheet.mergeCells(rowNumber, 1, rowNumber, colCount);
  const cell = sheet.getCell(rowNumber, 1);
  cell.value = title.toUpperCase();
  cell.font = { bold: true, size: 14, color: { argb: BRAND.WHITE }, name: "Calibri" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.NAVY } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(rowNumber).height = 36;
}

/**
 * Styles a subtitle row (row 2) with audit date and total count.
 */
export function styleSubtitle(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  colCount: number,
  extra?: string
): void {
  sheet.mergeCells(rowNumber, 1, rowNumber, colCount);
  const cell = sheet.getCell(rowNumber, 1);
  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  cell.value = `Tanggal Ekspor: ${dateStr}${extra ? ` — ${extra}` : ""} — HCMS BNI Finance`;
  cell.font = { italic: true, size: 9, color: { argb: "FF666666" }, name: "Calibri" };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(rowNumber).height = 20;
}

/**
 * Styles the column header row (usually row 3).
 * Applies GOLD background with NAVY bold text.
 * Reads header values from sheet.columns definitions.
 */
export function styleHeaderRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number
): void {
  const row = sheet.getRow(rowNumber);
  row.height = 26;

  sheet.columns.forEach((col, i) => {
    const cell = row.getCell(i + 1);
    cell.value = col.header as string;
    cell.font = { bold: true, size: 10, color: { argb: BRAND.NAVY }, name: "Calibri" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.GOLD } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD4A017" } },
      left: { style: "thin", color: { argb: "FFD4A017" } },
      bottom: { style: "thin", color: { argb: "FFD4A017" } },
      right: { style: "thin", color: { argb: "FFD4A017" } },
    };
  });
}

/**
 * Applies zebra-stripe styling to a data row.
 * Even index → ZEBRA, odd index → WHITE.
 */
export function applyDataRow(row: ExcelJS.Row, index: number): void {
  const bg = index % 2 === 0 ? BRAND.ZEBRA : BRAND.WHITE;
  row.height = 19;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.font = { size: 10, name: "Calibri" };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      bottom: { style: "hair", color: { argb: BRAND.BORDER } },
      right: { style: "hair", color: { argb: BRAND.BORDER } },
    };
  });
}

/**
 * Colors a status cell according to enrollment status.
 */
export function applyStatusCell(cell: ExcelJS.Cell, status: string): void {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    COMPLETED: { bg: BRAND.STATUS_COMPLETED_BG, fg: BRAND.STATUS_COMPLETED_FG, label: "Selesai" },
    FAILED:    { bg: BRAND.STATUS_FAILED_BG,    fg: BRAND.STATUS_FAILED_FG,    label: "Gagal" },
    IN_PROGRESS: { bg: BRAND.STATUS_PROGRESS_BG, fg: BRAND.STATUS_PROGRESS_FG, label: "Berjalan" },
    PENDING:   { bg: BRAND.STATUS_PENDING_BG,   fg: BRAND.STATUS_PENDING_FG,   label: "Menunggu" },
    REJECTED:  { bg: BRAND.STATUS_REJECTED_BG,  fg: BRAND.STATUS_REJECTED_FG,  label: "Ditolak" },
    CHEATING:  { bg: BRAND.STATUS_CHEATING_BG, fg: BRAND.STATUS_CHEATING_FG, label: "Curang" },
  };
  const s = map[status] ?? { bg: BRAND.STATUS_REJECTED_BG, fg: BRAND.STATUS_REJECTED_FG, label: status };
  cell.value = s.label;
  cell.font = { bold: true, size: 10, color: { argb: s.fg }, name: "Calibri" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: s.bg } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

/**
 * Colors a passed/failed cell for test results.
 */
export function applyPassedCell(cell: ExcelJS.Cell, passed: boolean | null): void {
  if (passed === null) {
    cell.value = "—";
    cell.alignment = { horizontal: "center", vertical: "middle" };
    return;
  }
  cell.value = passed ? "Lulus" : "Tidak Lulus";
  cell.font = {
    bold: true,
    size: 10,
    name: "Calibri",
    color: { argb: passed ? BRAND.STATUS_COMPLETED_FG : BRAND.STATUS_FAILED_FG },
  };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: passed ? BRAND.STATUS_COMPLETED_BG : BRAND.STATUS_FAILED_BG },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

/**
 * Colors a correct/incorrect cell for test answer details.
 */
export function applyCorrectCell(cell: ExcelJS.Cell, correct: boolean): void {
  cell.value = correct ? "Benar ✓" : "Salah ✗";
  cell.font = {
    bold: true,
    size: 10,
    name: "Calibri",
    color: { argb: correct ? BRAND.STATUS_COMPLETED_FG : BRAND.STATUS_FAILED_FG },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

/**
 * Centers alignment for specific column keys in a row.
 */
export function centerCols(row: ExcelJS.Row, keys: string[]): void {
  keys.forEach((k) => {
    row.getCell(k).alignment = { horizontal: "center", vertical: "middle" };
  });
}

/**
 * Adds a section divider row (full-width, GOLD background, left-aligned label).
 */
export function addSectionHeader(
  sheet: ExcelJS.Worksheet,
  label: string,
  colCount: number
): ExcelJS.Row {
  const row = sheet.addRow([label.toUpperCase()]);
  sheet.mergeCells(row.number, 1, row.number, colCount);
  const cell = sheet.getCell(row.number, 1);
  cell.font = { bold: true, size: 10, color: { argb: BRAND.NAVY }, name: "Calibri" };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.GOLD } };
  cell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  row.height = 22;
  return row;
}

/**
 * Freezes the first N data rows (title + subtitle + header = 3 by default)
 * and enables auto-filter on the header row.
 */
export function finalizeSheet(
  sheet: ExcelJS.Worksheet,
  colCount: number,
  frozenRows = 3
): void {
  const lastCol = String.fromCharCode(64 + colCount); // A=65
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: frozenRows }];
  sheet.autoFilter = {
    from: `A${frozenRows}`,
    to: `${lastCol}${frozenRows}`,
  };
}

// ─── Download Helper ───────────────────────────────────────────────────────

/**
 * Converts an ExcelJS buffer and triggers a browser download.
 */
export async function downloadExcel(
  workbook: ExcelJS.Workbook,
  filename: string
): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  );
}

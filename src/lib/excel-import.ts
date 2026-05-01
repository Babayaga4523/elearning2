/**
 * Excel/CSV Import Utilities
 * Handles bulk import of questions, users, and enrollments
 */

import ExcelJS from "exceljs";
import { log } from "@/lib/logger";

export interface QuestionImportRow {
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number; // 1, 2, 3, or 4
}

export interface UserImportRow {
  name: string;
  email: string;
  nip?: string;
  department?: string;
  lokasi?: string;
  password?: string;
}

export interface EnrollmentImportRow {
  email: string;
  courseTitle: string;
  deadline?: string;
}

/**
 * Parse Excel file for questions import
 */
export async function parseQuestionsExcel(
  buffer: Buffer
): Promise<{ success: boolean; data?: QuestionImportRow[]; errors?: string[] }> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return { success: false, errors: ["No worksheet found in Excel file"] };
    }

    const questions: QuestionImportRow[] = [];
    const errors: string[] = [];

    // Skip header row (row 1)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const questionText = row.getCell(1).value?.toString().trim();
        const option1 = row.getCell(2).value?.toString().trim();
        const option2 = row.getCell(3).value?.toString().trim();
        const option3 = row.getCell(4).value?.toString().trim();
        const option4 = row.getCell(5).value?.toString().trim();
        const correctOption = parseInt(row.getCell(6).value?.toString() || "0");

        // Validation
        if (!questionText) {
          errors.push(`Row ${rowNumber}: Question text is required`);
          return;
        }

        if (!option1 || !option2 || !option3 || !option4) {
          errors.push(`Row ${rowNumber}: All 4 options are required`);
          return;
        }

        if (![1, 2, 3, 4].includes(correctOption)) {
          errors.push(`Row ${rowNumber}: Correct option must be 1, 2, 3, or 4`);
          return;
        }

        questions.push({
          questionText,
          option1,
          option2,
          option3,
          option4,
          correctOption,
        });
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : "Parse error"}`);
      }
    });

    if (errors.length > 0) {
      log.warn("Questions import has errors", { errorCount: errors.length });
      return { success: false, errors };
    }

    if (questions.length === 0) {
      return { success: false, errors: ["No valid questions found in Excel file"] };
    }

    log.info("Questions parsed successfully", { count: questions.length });
    return { success: true, data: questions };
  } catch (error) {
    log.error("Failed to parse questions Excel", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, errors: ["Failed to parse Excel file"] };
  }
}

/**
 * Parse Excel file for users import
 */
export async function parseUsersExcel(
  buffer: Buffer
): Promise<{ success: boolean; data?: UserImportRow[]; errors?: string[] }> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return { success: false, errors: ["No worksheet found in Excel file"] };
    }

    const users: UserImportRow[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const name = row.getCell(1).value?.toString().trim();
        const email = row.getCell(2).value?.toString().trim();
        const nip = row.getCell(3).value?.toString().trim();
        const department = row.getCell(4).value?.toString().trim();
        const lokasi = row.getCell(5).value?.toString().trim();
        const password = row.getCell(6).value?.toString().trim();

        // Validation
        if (!name) {
          errors.push(`Row ${rowNumber}: Name is required`);
          return;
        }

        if (!email || !email.includes("@")) {
          errors.push(`Row ${rowNumber}: Valid email is required`);
          return;
        }

        users.push({
          name,
          email,
          nip: nip || undefined,
          department: department || undefined,
          lokasi: lokasi || undefined,
          password: password || undefined,
        });
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : "Parse error"}`);
      }
    });

    if (errors.length > 0) {
      log.warn("Users import has errors", { errorCount: errors.length });
      return { success: false, errors };
    }

    if (users.length === 0) {
      return { success: false, errors: ["No valid users found in Excel file"] };
    }

    log.info("Users parsed successfully", { count: users.length });
    return { success: true, data: users };
  } catch (error) {
    log.error("Failed to parse users Excel", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, errors: ["Failed to parse Excel file"] };
  }
}

/**
 * Parse Excel file for enrollments import
 */
export async function parseEnrollmentsExcel(
  buffer: Buffer
): Promise<{ success: boolean; data?: EnrollmentImportRow[]; errors?: string[] }> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return { success: false, errors: ["No worksheet found in Excel file"] };
    }

    const enrollments: EnrollmentImportRow[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const email = row.getCell(1).value?.toString().trim();
        const courseTitle = row.getCell(2).value?.toString().trim();
        const deadline = row.getCell(3).value?.toString().trim();

        // Validation
        if (!email || !email.includes("@")) {
          errors.push(`Row ${rowNumber}: Valid email is required`);
          return;
        }

        if (!courseTitle) {
          errors.push(`Row ${rowNumber}: Course title is required`);
          return;
        }

        enrollments.push({
          email,
          courseTitle,
          deadline: deadline || undefined,
        });
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : "Parse error"}`);
      }
    });

    if (errors.length > 0) {
      log.warn("Enrollments import has errors", { errorCount: errors.length });
      return { success: false, errors };
    }

    if (enrollments.length === 0) {
      return { success: false, errors: ["No valid enrollments found in Excel file"] };
    }

    log.info("Enrollments parsed successfully", { count: enrollments.length });
    return { success: true, data: enrollments };
  } catch (error) {
    log.error("Failed to parse enrollments Excel", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, errors: ["Failed to parse Excel file"] };
  }
}

/**
 * Generate Excel template for questions import
 */
export async function generateQuestionsTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Questions Template");

  // Header
  worksheet.columns = [
    { header: "Question Text", key: "question", width: 50 },
    { header: "Option 1", key: "option1", width: 30 },
    { header: "Option 2", key: "option2", width: 30 },
    { header: "Option 3", key: "option3", width: 30 },
    { header: "Option 4", key: "option4", width: 30 },
    { header: "Correct Option (1-4)", key: "correct", width: 20 },
  ];

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F1C3F" },
  };

  // Example data
  worksheet.addRow({
    question: "Apa ibu kota Indonesia?",
    option1: "Jakarta",
    option2: "Bandung",
    option3: "Surabaya",
    option4: "Medan",
    correct: 1,
  });

  worksheet.addRow({
    question: "Berapa hasil dari 2 + 2?",
    option1: "3",
    option2: "4",
    option3: "5",
    option4: "6",
    correct: 2,
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Generate Excel template for users import
 */
export async function generateUsersTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Users Template");

  worksheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "NIP (Optional)", key: "nip", width: 20 },
    { header: "Department (Optional)", key: "department", width: 25 },
    { header: "Lokasi (Optional)", key: "lokasi", width: 25 },
    { header: "Password (Optional)", key: "password", width: 20 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F1C3F" },
  };

  worksheet.addRow({
    name: "John Doe",
    email: "john.doe@bnifinance.co.id",
    nip: "12345",
    department: "IT",
    lokasi: "Jakarta",
    password: "password123",
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Generate Excel template for enrollments import
 */
export async function generateEnrollmentsTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Enrollments Template");

  worksheet.columns = [
    { header: "User Email", key: "email", width: 30 },
    { header: "Course Title", key: "courseTitle", width: 40 },
    { header: "Deadline (Optional, YYYY-MM-DD)", key: "deadline", width: 30 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F1C3F" },
  };

  worksheet.addRow({
    email: "john.doe@bnifinance.co.id",
    courseTitle: "Dasar-Dasar Ilmu Pengetahuan Alam",
    deadline: "2026-12-31",
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

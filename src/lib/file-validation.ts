/**
 * File Upload Validation
 * Server-side validation for file uploads
 * Includes file type, size, and basic security checks
 */

import { env } from "@/lib/env";
import { log } from "@/lib/logger";

// Allowed MIME types for PDF uploads
const ALLOWED_PDF_TYPES = [
  "application/pdf",
] as const;

// Magic bytes (file signatures) for PDF validation
const PDF_MAGIC_BYTES = [
  [0x25, 0x50, 0x44, 0x46], // %PDF
] as const;

// Maximum file size (from env or default 10MB)
const MAX_FILE_SIZE = parseInt(env.MAX_FILE_SIZE || "10485760");

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
}

/**
 * Validate file buffer against magic bytes
 * This prevents file extension spoofing
 */
function validateMagicBytes(buffer: Buffer): boolean {
  // Check PDF magic bytes
  for (const signature of PDF_MAGIC_BYTES) {
    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Validate PDF file upload
 * Performs multiple security checks:
 * 1. File size validation
 * 2. MIME type validation
 * 3. Magic bytes validation (prevents spoofing)
 * 4. File name sanitization
 */
export async function validatePDFUpload(
  file: File
): Promise<FileValidationResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const mimeType = file.type;

  // 1. Check file size
  if (fileSize === 0) {
    log.warn("File upload rejected: Empty file", { fileName });
    return {
      valid: false,
      error: "File kosong. Silakan pilih file yang valid.",
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(2);
    log.warn("File upload rejected: File too large", {
      fileName,
      fileSize,
      maxSize: MAX_FILE_SIZE,
    });
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeMB} MB.`,
    };
  }

  // 2. Check MIME type
  if (!ALLOWED_PDF_TYPES.includes(mimeType as any)) {
    log.warn("File upload rejected: Invalid MIME type", {
      fileName,
      mimeType,
      allowed: ALLOWED_PDF_TYPES,
    });
    return {
      valid: false,
      error: "Tipe file tidak valid. Hanya file PDF yang diperbolehkan.",
    };
  }

  // 3. Check file extension
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    log.warn("File upload rejected: Invalid extension", { fileName });
    return {
      valid: false,
      error: "Ekstensi file tidak valid. Hanya file .pdf yang diperbolehkan.",
    };
  }

  // 4. Validate magic bytes (file signature)
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer)) {
      log.security("File upload rejected: Magic bytes mismatch", {
        fileName,
        mimeType,
        firstBytes: Array.from(buffer.slice(0, 8)),
      });
      return {
        valid: false,
        error: "File tidak valid. File mungkin rusak atau bukan PDF asli.",
      };
    }
  } catch (error) {
    log.error("Error validating file magic bytes", {
      fileName,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      valid: false,
      error: "Gagal memvalidasi file. Silakan coba lagi.",
    };
  }

  // 5. Sanitize filename (prevent path traversal)
  const sanitizedName = sanitizeFileName(fileName);
  if (sanitizedName !== fileName) {
    log.security("File name sanitized", {
      original: fileName,
      sanitized: sanitizedName,
    });
  }

  // All checks passed
  log.info("File upload validated successfully", {
    fileName: sanitizedName,
    fileSize,
    mimeType,
  });

  return {
    valid: true,
    details: {
      fileName: sanitizedName,
      fileSize,
      mimeType,
    },
  };
}

/**
 * Sanitize file name to prevent path traversal attacks
 * Removes: ../, ..\, absolute paths, special characters
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  let sanitized = fileName.replace(/^.*[\\\/]/, "");

  // Remove dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, "");

  // Ensure it's not empty
  if (!sanitized) {
    sanitized = "file.pdf";
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop();
    sanitized = sanitized.substring(0, 250) + "." + ext;
  }

  return sanitized;
}

/**
 * Generate unique file name to prevent collisions
 */
export function generateUniqueFileName(originalName: string): string {
  const sanitized = sanitizeFileName(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 18);
  const ext = sanitized.split(".").pop();
  const nameWithoutExt = sanitized.replace(/\.[^/.]+$/, "");

  return `${timestamp}-${random}-${nameWithoutExt}.${ext}`;
}

/**
 * Validate file size before upload (client-side check)
 */
export function isFileSizeValid(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Check if file is potentially malicious
 * Basic heuristics for suspicious files
 */
export function checkSuspiciousFile(fileName: string, buffer: Buffer): boolean {
  // Check for double extensions (e.g., file.pdf.exe)
  const parts = fileName.split(".");
  if (parts.length > 2) {
    log.security("Suspicious file: Multiple extensions", { fileName });
    return true;
  }

  // Check for embedded executables in PDF (basic check)
  const content = buffer.toString("utf8", 0, Math.min(buffer.length, 10000));
  const suspiciousPatterns = [
    /\/JavaScript/i,
    /\/JS/i,
    /\/Launch/i,
    /\/EmbeddedFile/i,
    /\/AA/i, // Auto-action
    /\/OpenAction/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      log.security("Suspicious PDF content detected", {
        fileName,
        pattern: pattern.toString(),
      });
      return true;
    }
  }

  return false;
}

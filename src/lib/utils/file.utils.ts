"use server";

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'private', 'uploads');
const MODULES_DIR = path.join(UPLOAD_BASE_DIR, 'modules');

import { MAX_FILE_SIZE } from './file-constants';

/**
 * Pastikan direktori ada, buat jika belum ada.
 */
export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(MODULES_DIR, { recursive: true });
}

/**
 * Generate nama file unik yang aman.
 */
export async function generateSafeFilename(originalName: string): Promise<string> {
  const ext      = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 50); // batasi panjang nama
  const timestamp = Date.now();
  const random    = crypto.randomBytes(8).toString('hex');

  return `${timestamp}-${random}-${baseName}${ext}`;
}

/**
 * Simpan file Buffer ke direktori private.
 * Mengembalikan relative path untuk disimpan di DB.
 */
export async function saveFileToDisk(
  buffer: Buffer,
  filename: string
): Promise<string> {
  await ensureUploadDir();
  const filePath = path.join(MODULES_DIR, filename);
  await fs.writeFile(filePath, buffer);

  // Return relative path (disimpan di DB)
  return `modules/${filename}`;
}

/**
 * Baca file dari disk. Throw error jika tidak ada.
 */
export async function readFileFromDisk(relativePath: string): Promise<Buffer> {
  const filePath = path.join(UPLOAD_BASE_DIR, relativePath);

  // Security: pastikan path tidak keluar dari direktori uploads
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(UPLOAD_BASE_DIR);

  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal terdeteksi.');
  }

  return fs.readFile(resolvedPath);
}

/**
 * Hapus file dari disk secara aman.
 */
export async function deleteFileFromDisk(relativePath: string): Promise<void> {
  try {
    const filePath    = path.join(UPLOAD_BASE_DIR, relativePath);
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(UPLOAD_BASE_DIR);

    if (!resolvedPath.startsWith(resolvedBase)) return;
    await fs.unlink(resolvedPath);
  } catch (error) {
    // File sudah tidak ada, abaikan error
    console.warn(`[File] Gagal hapus file: ${relativePath}`, error);
  }
}

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function updatePassword(currentPassword: string, newPassword: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true }
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan" };
    }

    // Check if user has password (SSO users don't have password)
    if (!user.password) {
      return { 
        success: false, 
        error: "Akun Anda menggunakan SSO. Tidak dapat mengubah password di sini." 
      };
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return { success: false, error: "Password saat ini salah" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error) {
    console.error("[UPDATE_PASSWORD]", error);
    return { success: false, error: "Terjadi kesalahan sistem" };
  }
}

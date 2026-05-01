"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth-helpers";

export async function deleteUser(userId: string) {
  try {
    const result = await requireAdmin();
    if (!result || "success" in result) {
      return result || { success: false as const, error: "Unauthorized" };
    }

    // Verifikasi apakah user ada
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false as const, error: "Karyawan tidak ditemukan." };
    }

    // Lakukan penghapusan secara cascade didukung oleh schema.prisma
    await db.user.delete({
      where: { id: userId }
    });

    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error: any) {
    console.error("[DELETE_USER]", error);
    return { 
      success: false as const, 
      error: error?.message ?? "Terjadi kesalahan saat menghapus karyawan." 
    };
  }
}

import bcrypt from "bcryptjs";
import { UserRole } from "@/generated/client";

export async function updateUser(userId: string, data: {
  name?: string;
  email?: string;
  nip?: string;
  department?: string;
  lokasi?: string;
  password?: string;
  role?: UserRole;
  roles?: UserRole[];
}) {
  try {
    const result = await requireAdmin();
    if (!result || "success" in result) {
      return result || { success: false as const, error: "Unauthorized" };
    }

    // Cek jika email sudah digunakan oleh user lain
    if (data.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        return { success: false as const, error: "Email sudah digunakan oleh karyawan lain." };
      }
    }

    // Validate roles - must have at least one role
    if (data.roles && data.roles.length === 0) {
      return { success: false as const, error: "User harus memiliki minimal 1 role." };
    }

    const updateData: any = { ...data };

    // Handle password hashing
    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    } else {
      delete updateData.password;
    }

    // If roles are provided, update both roles array and legacy role field
    if (data.roles && data.roles.length > 0) {
      updateData.roles = data.roles;
      // Set legacy role field to first role for backward compatibility
      updateData.role = data.roles[0];
      // Reset activeRole so user must select role on next login
      updateData.activeRole = null;
    }

    await db.user.update({
      where: { id: userId },
      data: updateData
    });

    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error: any) {
    console.error("[UPDATE_USER]", error);
    return { 
      success: false as const, 
      error: error?.message ?? "Terjadi kesalahan saat memperbarui data karyawan." 
    };
  }
}

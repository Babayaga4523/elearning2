"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
  try {
    // Verifikasi apakah user ada
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "Karyawan tidak ditemukan." };
    }

    // Lakukan penghapusan secara cascade didukung oleh schema.prisma
    await db.user.delete({
      where: { id: userId }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_USER]", error);
    return { 
      success: false, 
      error: error?.message ?? "Terjadi kesalahan saat menghapus karyawan." 
    };
  }
}

export async function updateUser(userId: string, data: {
  name?: string;
  email?: string;
  nip?: string;
  department?: string;
  lokasi?: string;
}) {
  try {
    // Cek jika email sudah digunakan oleh user lain
    if (data.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        return { success: false, error: "Email sudah digunakan oleh karyawan lain." };
      }
    }

    await db.user.update({
      where: { id: userId },
      data
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_USER]", error);
    return { 
      success: false, 
      error: error?.message ?? "Terjadi kesalahan saat memperbarui data karyawan." 
    };
  }
}

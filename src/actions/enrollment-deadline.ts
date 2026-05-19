"use server";

import { revalidatePath } from "next/cache";
import { markExpiredEnrollmentsAsFailed } from "@/lib/scheduler";

/**
 * Server Action: Cek dan tandai enrollment yang expired sebagai FAILED.
 * Dipanggil secara otomatis dari halaman admin dan karyawan saat halaman dimuat.
 * Ini memastikan status selalu terkini bahkan sebelum cron job berjalan.
 */
export async function checkAndUpdateExpiredEnrollments() {
  try {
    const result = await markExpiredEnrollmentsAsFailed();
    // Revalidate paths so UI reflects the updated status
    revalidatePath("/admin/enrollments");
    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    revalidatePath("/courses");
    return { success: true, marked: result.marked };
  } catch (error: any) {
    console.error("[CHECK_EXPIRED_ENROLLMENTS] Error:", error);
    return { success: false, error: error.message };
  }
}

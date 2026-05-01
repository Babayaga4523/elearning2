"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function revalidateNotificationViews() {
  revalidatePath("/notifications");
  revalidatePath("/admin/notifications");
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  const updated = await db.notification.updateMany({
    where: { id: notificationId, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  if (updated.count === 0) {
    return { success: false as const, error: "Notifikasi tidak ditemukan." };
  }

  revalidateNotificationViews();
  return { success: true as const };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidateNotificationViews();
  return { success: true as const };
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";

import {
  NotificationsView,
  type NotificationListItem,
} from "@/components/notifications/notifications-view";
import { db } from "@/lib/db";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const rows = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const initialItems: NotificationListItem[] = rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    href: n.href,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="w-full min-w-0">
      <NotificationsView variant="admin" initialItems={initialItems} />
    </div>
  );
}

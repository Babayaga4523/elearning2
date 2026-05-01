"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState, useMemo } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  GraduationCap,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";

import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";

export type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

const typeIcons: Record<string, typeof Bell> = {
  ENROLLMENT: GraduationCap,
  COURSE_UPDATE: Megaphone,
  REMINDER: Clock,
  SYSTEM: Bell,
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type Variant = "admin" | "karyawan";

interface NotificationsViewProps {
  initialItems: NotificationListItem[];
  variant: Variant;
}

export function NotificationsView({ initialItems, variant }: NotificationsViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = variant === "admin";
  const unread = initialItems.filter((n) => !n.readAt).length;

  const totalPages = Math.ceil(initialItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return initialItems.slice(startIndex, startIndex + itemsPerPage);
  }, [initialItems, currentPage, itemsPerPage]);

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    const res = await action();
    if (!res.success && res.error) toast.error(res.error);
    else {
      startTransition(() => router.refresh());
      // Trigger custom event to refresh notification badge
      window.dispatchEvent(new Event("notification-read"));
    }
  }

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Notifikasi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {unread > 0
              ? `${unread} belum dibaca.`
              : "Semua notifikasi sudah dibaca."}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={pending || unread === 0}
          onClick={() =>
            run(async () => {
              const res = await markAllNotificationsRead();
              if (res.success) toast.success("Semua ditandai sudah dibaca.");
              return res;
            })
          }
          className="rounded-lg shrink-0"
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Tandai semua dibaca
        </Button>
      </div>

      {initialItems.length === 0 ? (
        <Card className="rounded-lg border-dashed border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Belum ada notifikasi
            </CardTitle>
            <CardDescription className="text-sm">
              Pemberitahuan tentang kursus dan aktivitas Anda akan muncul di sini.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {paginatedItems.map((item) => {
              const Icon = typeIcons[item.type] ?? Bell;
              const isUnread = !item.readAt;

              return (
                <li key={item.id}>
                  <Card
                    className={cn(
                      "rounded-lg transition-shadow border",
                      isUnread
                        ? "border-blue-200 bg-white shadow-sm"
                        : "border-slate-100 bg-slate-50/60 opacity-90"
                    )}
                  >
                    <CardContent className="p-4 sm:p-5 flex gap-4">
                      <div
                        className={cn(
                          "h-11 w-11 rounded-lg flex items-center justify-center shrink-0",
                          isAdmin ? "bg-slate-900/5 text-slate-900" : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                            {item.title}
                          </p>
                          {isUnread && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Baru
                            </span>
                          )}
                        </div>
                        {item.body && (
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {item.body}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 pt-1">
                          {formatWhen(item.createdAt)}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-3">
                          {item.href && (
                            <Button
                              asChild
                              size="sm"
                              className="rounded-lg"
                            >
                              <Link href={item.href}>Buka</Link>
                            </Button>
                          )}
                          {isUnread && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              className="rounded-lg"
                              onClick={() =>
                                run(async () => markNotificationRead(item.id))
                              }
                            >
                              <Check className="h-4 w-4 mr-1.5" />
                              Tandai dibaca
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={initialItems.length}
              itemsPerPage={itemsPerPage}
              itemLabel="notifikasi"
            />
          )}
        </>
      )}
    </div>
  );
}

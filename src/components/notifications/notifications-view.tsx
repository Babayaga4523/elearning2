"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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

  const isAdmin = variant === "admin";
  const unread = initialItems.filter((n) => !n.readAt).length;

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await action();
      if (!res.success && res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={cn(
              "text-2xl font-black tracking-tight",
              isAdmin ? "text-[#0F1C3F]" : "text-slate-900"
            )}
          >
            Notifikasi
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
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
          className={cn(
            "rounded-xl font-bold shrink-0",
            isAdmin && "border-slate-200 hover:border-[#E8A020]/40 hover:bg-[#E8A020]/5"
          )}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Tandai semua dibaca
        </Button>
      </div>

      {initialItems.length === 0 ? (
        <Card
          className={cn(
            "rounded-2xl border-dashed",
            isAdmin ? "border-slate-200 bg-white/80" : "border-slate-200 bg-white"
          )}
        >
          <CardHeader>
            <CardTitle className="text-lg font-black text-slate-800">
              Belum ada notifikasi
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Pemberitahuan tentang kursus dan aktivitas Anda akan muncul di sini.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-3">
          {initialItems.map((item) => {
            const Icon = typeIcons[item.type] ?? Bell;
            const isUnread = !item.readAt;

            return (
              <li key={item.id}>
                <Card
                  className={cn(
                    "rounded-2xl transition-all border",
                    isUnread
                      ? isAdmin
                        ? "border-[#E8A020]/30 bg-white shadow-sm shadow-[#0F1C3F]/5"
                        : "border-primary/25 bg-white shadow-sm"
                      : "border-slate-100 bg-slate-50/60 opacity-90"
                  )}
                >
                  <CardContent className="p-4 sm:p-5 flex gap-4">
                    <div
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                        isAdmin ? "bg-[#0F1C3F]/5 text-[#0F1C3F]" : "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                          {item.title}
                        </p>
                        {isUnread && (
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full",
                              isAdmin
                                ? "bg-[#E8A020]/15 text-[#0F1C3F]"
                                : "bg-primary/15 text-primary"
                            )}
                          >
                            Baru
                          </span>
                        )}
                      </div>
                      {item.body && (
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                          {item.body}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-400 pt-1">
                        {formatWhen(item.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-3">
                        {item.href && (
                          <Button
                            asChild
                            size="sm"
                            className={cn(
                              "rounded-lg font-bold",
                              isAdmin && "bg-[#0F1C3F] hover:bg-[#1A3060] text-white"
                            )}
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
                            className="rounded-lg font-bold"
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
      )}
    </div>
  );
}

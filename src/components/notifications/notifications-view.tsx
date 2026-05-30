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
  Inbox,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const typeConfig: Record<string, { bg: string; text: string; border: string }> = {
  ENROLLMENT: {
    bg: "bg-[#EFF8FF]",
    text: "text-[#175CD3]",
    border: "border-[#B2DDFF]",
  },
  COURSE_UPDATE: {
    bg: "bg-[#FFFBEB]",
    text: "text-[#B45309]",
    border: "border-[#FEF3C7]",
  },
  REMINDER: {
    bg: "bg-[#FFF1F2]",
    text: "text-[#E11D48]",
    border: "border-[#FFE4E6]",
  },
  SYSTEM: {
    bg: "bg-[#F8F9FC]",
    text: "text-[#0F1C3F]",
    border: "border-[#CBD2E0]",
  },
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
    <div className="w-full min-w-0 max-w-3xl mx-auto space-y-8 font-['DM_Sans']">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between bg-white px-6 py-5 rounded-2xl border border-[#E4E7EC] shadow-[0_4px_20px_rgb(0,0,0,0.01)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#E8A020] mb-0.5">
            <span className="text-[#E8A020] animate-pulse">✦</span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase font-['Lexend_Deca']">
              BNI FINANCE PUSAT INFORMASI
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F1C3F] font-['Lexend_Deca']">
            Notifikasi Saya
          </h1>
          <p className="text-sm text-[#475467] font-medium">
            {unread > 0 ? (
              <span>Anda memiliki <span className="font-extrabold text-[#E8A020]">{unread} pemberitahuan</span> belum dibaca.</span>
            ) : (
              <span className="text-[#059669] font-semibold">Semua notifikasi sudah dibaca dengan bersih.</span>
            )}
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
          className="rounded-xl border-[#D0D5DD] text-[#344054] hover:bg-[#F8F9FC] font-semibold active:scale-[0.98] transition-all duration-200 shrink-0 gap-2 border shadow-sm"
        >
          <CheckCheck className="h-4 w-4 text-[#059669]" />
          Tandai Semua Dibaca
        </Button>
      </div>

      {initialItems.length === 0 ? (
        <Card className="rounded-2xl border-2 border-dashed border-[#E4E7EC] bg-white p-12 text-center shadow-[0_4px_20px_rgb(0,0,0,0.015)]">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <div className="relative flex items-center justify-center w-14 h-14 bg-[#FFFBEB] rounded-2xl border border-[#FEF3C7] shadow-inner mb-4">
              <Bell className="h-6 w-6 text-[#E8A020] animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca'] mb-1.5">
              Belum Ada Notifikasi Baru
            </h3>
            <p className="text-sm font-medium text-[#475467] max-w-sm mx-auto leading-relaxed">
              Pemberitahuan tentang penugasan kursus, pembaruan modul, dan aktivitas akun Anda akan ditampilkan di sini secara pintar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="space-y-4">
            {paginatedItems.map((item) => {
              const Icon = typeIcons[item.type] ?? Bell;
              const isUnread = !item.readAt;
              const cfg = typeConfig[item.type] || typeConfig.SYSTEM;

              return (
                <li key={item.id} className="transition-all duration-300">
                  <Card
                    className={cn(
                      "rounded-2xl border transition-all duration-300 overflow-hidden",
                      isUnread
                        ? "border-[#E4E7EC] bg-white shadow-[0_4px_25px_rgba(15,28,63,0.03)] border-l-4 border-l-[#E8A020]"
                        : "border-[#E4E7EC] bg-[#F8F9FC]/70 opacity-80"
                    )}
                  >
                    <CardContent className="p-5 flex gap-4 sm:gap-5 items-start">
                      
                      {/* Icon Box */}
                      <div
                        className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border",
                          cfg.bg,
                          cfg.text,
                          cfg.border
                        )}
                      >
                        <Icon className="h-5.5 w-5.5" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-[#0F1C3F] text-sm sm:text-base leading-snug font-['Lexend_Deca']">
                                {item.title}
                              </h4>
                              {isUnread && (
                                <Badge className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] shadow-none uppercase tracking-wide">
                                  Baru
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-[#98A2B3] font-semibold font-['DM_Sans']">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{formatWhen(item.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {item.body && (
                          <p className="text-sm font-medium text-[#475467] leading-relaxed bg-[#F8F9FC] border border-[#E4E7EC] p-3.5 rounded-xl">
                            {item.body}
                          </p>
                        )}

                        {/* Actions */}
                        {(item.href || isUnread) && (
                          <div className="flex flex-wrap gap-2.5 pt-2.5">
                            {item.href && (
                              <Button
                                asChild
                                size="sm"
                                className="rounded-xl bg-[#0F1C3F] hover:bg-[#1A2E63] text-white font-semibold transition-all duration-200 active:scale-[0.98] shadow-md shadow-[#0F1C3F]/10 gap-1 px-4 py-2 text-xs"
                              >
                                <Link href={item.href}>
                                  Buka Halaman
                                  <ArrowRight className="h-3.5 w-3.5 text-[#E8A020] animate-pulse" />
                                </Link>
                              </Button>
                            )}
                            {isUnread && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={pending}
                                className="rounded-xl border-[#D0D5DD] text-[#344054] hover:bg-[#F8F9FC] font-semibold transition-all duration-200 active:scale-[0.98] gap-1 px-4 py-2 text-xs"
                                onClick={() =>
                                  run(async () => markNotificationRead(item.id))
                                }
                              >
                                <Check className="h-3.5 w-3.5 text-[#059669] mr-0.5" />
                                Tandai Dibaca
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={initialItems.length}
                itemsPerPage={itemsPerPage}
                itemLabel="notifikasi"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

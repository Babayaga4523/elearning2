"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "admin" | "karyawan";

export function NotificationBellLink({ variant }: { variant: Variant }) {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  const href = pathname.startsWith("/admin") ? "/admin/notifications" : "/notifications";

  const loadCount = async () => {
    if (!window.navigator.onLine) return;

    try {
      const res = await fetch("/api/notifications/unread-count");
      
      // If unauthorized, return
      if (res.status === 401) {
        return;
      }

      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      setCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    let cancelled = false;
    const intervalId = setInterval(async () => {
      if (cancelled) return;
      await loadCount();
    }, 60_000);

    // Initial load
    loadCount();

    // Listen for custom event to refresh count immediately
    const handleRefresh = () => {
      if (!cancelled) {
        loadCount();
      }
    };

    window.addEventListener("notification-read", handleRefresh);
    window.addEventListener("focus", handleRefresh); // Refresh when window gains focus

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("notification-read", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, []);

  const unread = count ?? 0;

  const isAdmin = variant === "admin";

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-10 w-10 rounded-xl",
        isAdmin ? "hover:bg-slate-100" : "hover:bg-primary/10"
      )}
    >
      <Link href={href} aria-label="Notifikasi" className="flex items-center justify-center">
        <Bell
          className={cn("h-5 w-5", isAdmin ? "text-slate-600" : "text-slate-600")}
        />
        {unread > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 min-h-[1.125rem] min-w-[1.125rem] px-1 rounded-full text-[10px] font-black leading-none flex items-center justify-center border-2 border-white",
              isAdmin ? "bg-[#E8A020] text-[#0F1C3F]" : "bg-primary text-white"
            )}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}

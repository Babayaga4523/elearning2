"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const MobileSidebar = () => {
  const { isMobileOpen, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tutup sidebar jika navigasi terjadi
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      closeMobileSidebar();
      prevPathname.current = pathname;
    }
  }, [pathname, closeMobileSidebar]);

  if (!mounted) return null;

  return (
    <Sheet open={isMobileOpen} onOpenChange={(open) => !open && closeMobileSidebar()}>
      <SheetContent side="left" className="p-0 bg-[#0F1C3F] border-r-white/10 w-72">
        <SheetHeader className="h-14 px-4 flex flex-row items-center justify-between border-b border-white/10 space-y-0 text-left">
          <SheetTitle className="sr-only">Menu Navigasi Admin</SheetTitle>
          <SheetDescription className="sr-only">Menu navigasi untuk akses fitur admin</SheetDescription>
          <Link href="/admin" className="flex items-center gap-2.5" onClick={closeMobileSidebar}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#E8A020] to-[#F5C842] flex items-center justify-center shadow-md shadow-[#E8A020]/20">
              <span className="font-bold text-white text-base">B</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-[12px] text-white tracking-tight">BNI FINANCE</span>
              <span className="text-[8px] font-semibold text-[#E8A020] tracking-widest uppercase">Admin Console</span>
            </div>
          </Link>
          
          {/* Close Button - Hamburger Style */}
          <button
            onClick={closeMobileSidebar}
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-200",
              "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#E8A020]/50",
              "hover:scale-105 active:scale-95"
            )}
            aria-label="Close menu"
            type="button"
          >
            <X className="h-5 w-5 text-[#E8A020]" />
          </button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-2 py-4 shadow-inner">
          <Sidebar hideHeader />
        </div>
      </SheetContent>
    </Sheet>
  );
};

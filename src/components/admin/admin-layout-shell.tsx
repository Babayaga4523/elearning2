"use client";

import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { AdminNavbar } from "./admin-navbar";
import { Menu, X } from "lucide-react";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export const AdminLayoutShell = ({
  children,
  userName,
  userEmail,
}: AdminLayoutShellProps) => {
  const { isDesktopMini, isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div className="h-full bg-[#F0F2F7]">
      {/* Sidebar Desktop */}
      <div
        className={cn(
          "hidden md:flex h-full flex-col fixed inset-y-0 z-30 transition-all duration-300 ease-in-out border-r border-slate-200/60 bg-[#0F1C3F]",
          isDesktopMini ? "w-20" : "w-64"
        )}
      >
        <Sidebar />
      </div>

      {/* Sidebar Mobile - Slide from Left */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-[#0F1C3F] border-r border-white/10 transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>

      {/* Mobile Toggle Button - Clean Modern Design */}
      <button
        onClick={toggleMobileSidebar}
        className={cn(
          "md:hidden fixed top-20 z-50 transition-all duration-300 ease-in-out",
          "h-12 w-10 flex items-center justify-center",
          "bg-white/95 backdrop-blur-sm border border-slate-200",
          "shadow-lg hover:shadow-xl",
          isMobileOpen ? "left-64 rounded-r-xl border-l-0" : "left-0 rounded-r-xl",
          "hover:scale-105 active:scale-95",
          "group"
        )}
        aria-label="Toggle menu"
        type="button"
        suppressHydrationWarning
      >
        {/* Clean Icon Design */}
        <div className="relative flex items-center justify-center">
          {isMobileOpen ? (
            <X className="h-5 w-5 text-slate-600 transition-all duration-300 group-hover:text-[#E8A020]" />
          ) : (
            <Menu className="h-5 w-5 text-slate-600 transition-all duration-300 group-hover:text-[#E8A020]" />
          )}
        </div>
        
        {/* Subtle indicator dot */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className={cn(
            "h-1 w-1 rounded-full transition-all duration-300",
            isMobileOpen ? "bg-[#E8A020]" : "bg-slate-300"
          )} />
        </div>
      </button>

      {/* Overlay for mobile when sidebar is open */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Konten Utama */}
      <main
        className={cn(
          "h-full min-h-screen flex flex-col transition-all duration-300 ease-in-out",
          isDesktopMini ? "md:pl-20" : "md:pl-64"
        )}
      >
        <AdminNavbar userName={userName} userEmail={userEmail} />
        {/* Tighter, more professional content spacing */}
        <div className="flex-1 animate-in fade-in duration-700 px-4 pb-4 pt-3 md:px-5 md:pb-6 md:pt-4 lg:px-6 lg:pb-8 lg:pt-5">
          {children}
        </div>
      </main>
    </div>
  );
};

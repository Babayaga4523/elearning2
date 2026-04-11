"use client";

import { usePathname } from "next/navigation";
import { 
  Search, 
  ChevronRight,
  User,
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { MobileSidebar } from "./mobile-sidebar";
import { cn } from "@/lib/utils";

interface AdminNavbarProps {
  userName: string;
  userEmail: string;
}

export const AdminNavbar = ({
  userName,
  userEmail
}: AdminNavbarProps) => {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { label, href, isLast };
  });

  return (
    <div className="flex h-20 items-center border-b bg-white/70 backdrop-blur-xl sticky top-0 z-[40] transition-all duration-300 px-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-3 md:hidden">
        <MobileSidebar />
      </div>

      <div className="hidden md:flex items-center gap-2">
        <nav className="flex items-center space-x-2 text-sm font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
              <Link
                href={crumb.href}
                className={cn(
                  "transition-colors hover:text-[#E8A020]",
                  crumb.isLast ? "text-[#0F1C3F] font-bold" : "text-slate-500"
                )}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Mock Search */}
        <div className="hidden lg:flex relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#E8A020] transition-colors" />
          <input 
            type="text" 
            placeholder="Search console..." 
            className="h-10 w-64 pl-10 pr-4 rounded-xl bg-slate-100/50 border-transparent focus:bg-white focus:border-[#E8A020]/20 focus:ring-4 focus:ring-[#E8A020]/5 transition-all text-sm font-medium outline-none"
          />
        </div>

        <NotificationBellLink variant="admin" />

        <div className="h-8 w-[1px] bg-slate-100 mx-1" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100 transition-all outline-none group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0F1C3F] to-[#1A3060] flex items-center justify-center text-[#E8A020] font-black text-sm shadow-lg shadow-[#0F1C3F]/20 group-hover:scale-105 transition-transform">
                {userName?.charAt(0)}
              </div>
              <div className="hidden xl:flex flex-col items-start leading-tight">
                <span className="text-sm font-black text-slate-900">{userName}</span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> ADMIN
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <DropdownMenuLabel className="p-4 flex flex-col pt-2">
              <p className="text-sm font-black text-slate-900">{userName}</p>
              <p className="text-xs font-medium text-slate-400 truncate mt-0.5">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50" />
            <div className="p-1 space-y-1">
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group hover:bg-slate-100 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-white transition-colors">
                   <User className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">Akun Saya</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group hover:bg-slate-100 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-white transition-colors">
                   <Settings className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">Pengaturan</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-slate-50" />
            <div className="p-1">
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group hover:bg-rose-50 text-rose-600 transition-colors focus:bg-rose-50"
              >
                <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center group-hover:bg-white transition-colors">
                   <LogOut className="h-4 w-4" />
                </div>
                <span className="text-sm font-black">Keluar</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

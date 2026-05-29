"use client";

import { usePathname } from "next/navigation";
import {
  Search,
  ChevronRight,
  User,
  LogOut,
  Sparkles,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { HydrationBoundary } from "@/components/ui/hydration-boundary";
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

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { label, href, isLast };
  });

  return (
    <div className="flex items-center w-full gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center flex-1 min-w-0">
        <nav className="flex items-center space-x-2 text-sm font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-300" />}
              <Link
                href={crumb.href}
                className={cn(
                  "transition-colors hover:text-[#E8A020] px-2 py-1 rounded-md hover:bg-slate-50 truncate",
                  crumb.isLast ? "text-[#0F1C3F] font-semibold" : "text-slate-500"
                )}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3" suppressHydrationWarning>
        {/* Search - Desktop Only */}
        <div className="hidden lg:flex relative group" role="search">
          <label htmlFor="admin-search-console" className="sr-only">Cari di konsol admin</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#E8A020] transition-colors" aria-hidden="true" />
          <input
            id="admin-search-console"
            name="q"
            type="search"
            role="searchbox"
            placeholder="Search console..."
            autoComplete="off"
            aria-label="Cari di konsol admin"
            className="h-9 w-64 pl-10 pr-4 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#E8A020] focus:ring-2 focus:ring-[#E8A020]/20 transition-colors duration-200 text-sm font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Notification Bell */}
        <NotificationBellLink variant="admin" />

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        {/* User Profile Dropdown */}
        <HydrationBoundary fallback={
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50">
            <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-[#0F1C3F] to-[#1A3060] text-[#E8A020] font-bold text-xs">
                {userName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-xs font-bold text-slate-800">{userName}</span>
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Admin
              </span>
            </div>
          </div>
        }>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menu profil admin"
                aria-haspopup="menu"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A020] focus-visible:ring-offset-2 group active:scale-95 border border-transparent hover:border-slate-200"
              >
                <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-[#E8A020]/30 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-[#0F1C3F] to-[#1A3060] text-[#E8A020] font-bold text-xs">
                    {userName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col leading-tight">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F1C3F]">{userName}</span>
                  <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Admin
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#E8A020] transition-colors hidden lg:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Menu Items */}
              <div className="space-y-0.5">
                <Link href="/admin/profile">
                  <DropdownMenuItem className="rounded-lg flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-all group">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <User className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-700 group-hover:text-[#0F1C3F]">Profil Saya</p>
                      <p className="text-[10px] text-slate-500">Kelola informasi akun</p>
                    </div>
                  </DropdownMenuItem>
                </Link>
              </div>

              <DropdownMenuSeparator className="bg-slate-100 my-1.5" />

              {/* Logout */}
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="rounded-lg flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-rose-50 text-rose-600 transition-all focus:bg-rose-50 group"
              >
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold">Keluar</p>
                  <p className="text-[10px] text-rose-500">Logout dari sistem</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </HydrationBoundary>
      </div>
    </div>
  );
};
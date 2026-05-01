"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { BookOpen, Compass, LayoutDashboard, BarChart3, CalendarDays, Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationBellLink } from "@/components/notifications/notification-bell-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEST_PAGE_PATTERNS = [
  /\/courses\/[^/]+\/tests\/[^/]+/,     // halaman mengerjakan ujian & result
];

function isTestPage(pathname: string): boolean {
  return TEST_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: Compass },
  { href: "/performance", label: "Performa", icon: BarChart3 },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
];

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    department?: string | null;
    image?: string | null;
  };
}

export const Navbar = ({ user }: NavbarProps = {}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isHidden = useMemo(() => isTestPage(pathname), [pathname]);

  if (isHidden) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/dashboard" className="flex items-center group flex-shrink-0">
              <div className="relative h-12 flex items-center">
                <Image
                  src="/logo bnifinance.png"
                  alt="BNI Finance"
                  width={180}
                  height={45}
                  className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:text-primary hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-x-2 sm:gap-x-3">
              <NotificationBellLink variant="karyawan" />
              
              {/* Desktop User Menu */}
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200 bg-white shadow-sm">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                      <AvatarImage 
                        src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '?')}&background=0f1c3f&color=fff&bold=true`}
                        alt={user?.name || "User avatar"}
                      />
                      <AvatarFallback className="bg-[#0F1C3F] text-white text-xs font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-bold text-slate-900 leading-none">
                        {user?.name || "Karyawan"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {user?.department || "BNI Finance"}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold text-slate-900">
                          {user?.name || "Karyawan"}
                        </p>
                        <p className="text-xs text-slate-500 font-normal">
                          {user?.email || ""}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        <span>Profil Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {/* User Info Mobile */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg mb-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage 
                    src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '?')}&background=0f1c3f&color=fff&bold=true`}
                    alt={user?.name || "User avatar"}
                  />
                  <AvatarFallback className="bg-[#0F1C3F] text-white font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {user?.name || "Karyawan"}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {user?.department || "BNI Finance"}
                  </p>
                </div>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              
              <div className="pt-3 border-t border-slate-200 mt-3 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-x-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <User className="h-5 w-5" />
                  <span>Profil Saya</span>
                </Link>
                <LogoutButton className="w-full h-10 text-sm bg-slate-50 hover:bg-slate-100 border border-slate-200" />
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

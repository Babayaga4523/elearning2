"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Compass,
  BarChart2,
  Calendar,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  TrendingUp,
  Award,
} from "lucide-react";
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

const TEST_PATTERNS = [
  /\/courses\/[^/]+\/tests\/[^/]+/,
];

function isTestPage(pathname: string) {
  return TEST_PATTERNS.some((p) => p.test(pathname));
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Kursus", icon: Compass },
  { href: "/performance", label: "Performa", icon: TrendingUp },
  { href: "/calendar", label: "Kalender", icon: Calendar },
];

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    department?: string | null;
    image?: string | null;
  };
}

/* ─── NavLink Item ──────────────────────────────────────────────── */
function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative",
        isActive
          ? "bg-[#0F1C3F] text-white shadow-md"
          : "text-[#64748B] hover:text-[#0F1C3F] hover:bg-[#F1F5F9]"
      )}
    >
      {/* Active indicator dot */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#E8A020] rounded-r-full" />
      )}
      <Icon
        size={16}
        className={cn(
          "transition-colors duration-200",
          isActive ? "text-[#E8A020]" : "text-[#94A3B8] group-hover:text-[#0F1C3F]"
        )}
      />
      <span className="hidden xl:block">{label}</span>
    </Link>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
export const Navbar = ({ user }: NavbarProps = {}) => {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHidden = useMemo(() => isTestPage(pathname), [pathname]);

  if (isHidden) return null;

  const initials = (user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E4E7EC]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">

            {/* ── Logo ──────────────────────────────────────── */}
            <Link href="/dashboard" className="group flex items-center shrink-0">
              <div className="relative">
                <Image
                  src="/logo bnifinance.png"
                  alt="BNI Finance"
                  width={172}
                  height={42}
                  className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  priority
                />
              </div>
            </Link>

            {/* ── Desktop Nav ───────────────────────────────── */}
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-[#F8F9FB] border border-[#E4E7EC]/60">
              {navLinks.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  isActive={
                    pathname === link.href ||
                    (link.href !== "/dashboard" && pathname.startsWith(link.href + "/"))
                  }
                />
              ))}
            </div>

            {/* ── Right Actions ─────────────────────────────── */}
            <div className="flex items-center gap-2">
              <NotificationBellLink variant="karyawan" />

              {/* Desktop User Menu */}
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[#E4E7EC] bg-white hover:bg-[#F8F9FB] transition-all duration-200 group shadow-sm">
                    <Avatar className="h-8 w-8 ring-2 ring-[#E4E7EC]">
                      <AvatarImage
                        src={
                          user?.image ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "?")}&background=0F1C3F&color=fff&bold=true&size=64`
                        }
                        alt={user?.name || ""}
                      />
                      <AvatarFallback className="bg-[#0F1C3F] text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-bold text-[#0F1C3F] leading-tight">
                        {user?.name || "Karyawan"}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] leading-tight mt-0.5">
                        {user?.department || "BNI Finance"}
                      </p>
                    </div>
                    <ChevronDown
                      size={14}
                      className="text-[#94A3B8] group-hover:text-[#64748B] transition-colors hidden lg:block"
                    />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-60 mt-2 py-1.5">
                    <DropdownMenuLabel className="px-3 py-2">
                      <p className="text-sm font-bold text-[#0F1C3F]">{user?.name || "Karyawan"}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1.5" />
                    <DropdownMenuItem asChild className="py-2.5 px-3 cursor-pointer">
                      <Link href="/profile" className="flex items-center gap-2.5 text-sm">
                        <User size={15} className="text-[#64748B]" />
                        <span>Profil Saya</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1.5" />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="py-2.5 px-3 text-rose-600 cursor-pointer hover:bg-rose-50"
                    >
                      <LogOut size={15} />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E4E7EC] bg-white">
            <div className="px-4 py-4 space-y-1">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-3 bg-[#F8F9FB] rounded-xl mb-3">
                <Avatar className="h-10 w-10 ring-2 ring-white shadow">
                  <AvatarImage
                    src={
                      user?.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "?")}&background=0F1C3F&color=fff&bold=true&size=64`
                    }
                    alt=""
                  />
                  <AvatarFallback className="bg-[#0F1C3F] text-white text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-[#0F1C3F]">{user?.name || "Karyawan"}</p>
                  <p className="text-xs text-[#94A3B8]">{user?.department || "BNI Finance"}</p>
                </div>
              </div>

              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-[#0F1C3F] text-white"
                        : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F1C3F]"
                    )}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}

              <div className="pt-3 border-t border-[#E4E7EC] mt-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F1C3F] transition-all"
                >
                  <User size={18} />
                  Profil Saya
                </Link>
                <LogoutButton className="w-full text-left px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold text-sm" />
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

"use client";

import React from "react";
import { 
  Users, 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  History, 
  Calendar,
  Lock,
  FileBarChart,
  Menu,
  X,
  GraduationCap,
  Clock,
  Upload,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  color: string;
  subItems?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    color: "text-sky-500",
  },
  {
    label: "Manajemen Kursus",
    icon: BookOpen,
    href: "/admin/courses",
    color: "text-violet-500",
  },
  {
    label: "Enrollment",
    icon: GraduationCap,
    href: "/admin/enrollments",
    color: "text-emerald-500",
  },
  {
    label: "Karyawan",
    icon: Users,
    href: "/admin/users",
    color: "text-orange-500",
  },
  {
    label: "Import Data",
    icon: Upload,
    href: "/admin/import",
    color: "text-blue-500",
    subItems: [
      { label: "Import Soal", href: "/admin/import/questions" },
      { label: "Import Karyawan", href: "/admin/import/users" },
      { label: "Import Enrollment", href: "/admin/import/enrollments" },
    ],
  },
  {
    label: "Analytics",
    icon: FileBarChart,
    color: "text-pink-500",
    subItems: [
      { label: "Overview", href: "/admin/analytics" },
      { label: "Progress Tracking", href: "/admin/analytics/progress" },
    ],
  },
  {
    label: "Kalender",
    icon: Calendar,
    href: "/admin/calendar",
    color: "text-yellow-500",
  },
  {
    label: "Scheduler",
    icon: Clock,
    href: "/admin/scheduler",
    color: "text-cyan-500",
  },
  {
    label: "Log Sistem",
    icon: History,
    href: "/admin/logs",
    color: "text-slate-500",
  },
  {
    label: "Akun Terkunci",
    icon: Lock,
    href: "/admin/locked-accounts",
    color: "text-rose-500",
  },
  {
    label: "Pengaturan",
    icon: Settings,
    href: "/admin/settings",
    color: "text-gray-500",
  },
];

export interface SidebarProps {
  hideHeader?: boolean;
}

export const Sidebar = ({ hideHeader = false }: SidebarProps) => {
  const pathname = usePathname();
  const { isDesktopMini, toggleDesktopSidebar } = useSidebar();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [lockedCount, setLockedCount] = React.useState(0);

  // Debug log
  console.log("[Sidebar] isDesktopMini:", isDesktopMini);

  // Fetch locked accounts count
  React.useEffect(() => {
    const fetchLockedCount = async () => {
      try {
        const response = await fetch("/api/admin/locked-accounts/count");
        if (response.ok) {
          const data = await response.json();
          setLockedCount(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch locked accounts count:", error);
      }
    };

    fetchLockedCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLockedCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <div className="flex h-full flex-col bg-[#0F1C3F] text-white">
      {/* Header / Logo - Hidden when used in mobile sidebar */}
      {!hideHeader && (
        <div className={cn(
          "flex h-24 items-center border-b border-white/10 relative bg-gradient-to-r from-[#0F1C3F] to-[#162754]",
          isDesktopMini ? "px-3 justify-center" : "px-4 justify-center"
        )}>
          <Link href="/admin" className="flex group w-full">
            {!isDesktopMini ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="relative group-hover:scale-105 transition-all duration-300">
                  <Image
                    src="/logo bnifinance.png"
                    alt="BNI Finance Logo"
                    width={120}
                    height={40}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto', maxWidth: '120px', maxHeight: '40px' }}
                    priority
                  />
                </div>
                <div className="flex flex-col items-center leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="font-bold text-white text-sm tracking-tight">Admin Console</span>
                  <span className="text-[9px] font-semibold text-[#E8A020] tracking-widest uppercase">Management System</span>
                </div>
              </div>
            ) : (
              <div className="relative group-hover:scale-105 transition-all duration-300">
                <Image
                  src="/logo bnifinance.png"
                  alt="BNI Finance Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  style={{ width: 'auto', height: 'auto', maxWidth: '32px', maxHeight: '32px' }}
                />
              </div>
            )}
          </Link>
          
          {/* Toggle Button in Sidebar - Desktop Only - CLEAN MODERN DESIGN */}
          <button
            onClick={toggleDesktopSidebar}
            className={cn(
              "hidden md:flex h-7 w-7 rounded-lg items-center justify-center transition-all duration-300 absolute top-2 right-2",
              "bg-white/10 backdrop-blur-sm",
              "border border-white/20 shadow-lg",
              "hover:bg-white/20 hover:scale-105 hover:border-[#E8A020]/50",
              "active:scale-95",
              "group relative"
            )}
            aria-label="Toggle sidebar"
            type="button"
            suppressHydrationWarning
          >
            {/* Animated Icon */}
            <div className="relative flex items-center justify-center">
              {isDesktopMini ? (
                <Menu className="h-3 w-3 text-white transition-all duration-300 group-hover:text-[#E8A020]" />
              ) : (
                <Menu className="h-3 w-3 text-white transition-all duration-300 group-hover:text-[#E8A020] rotate-90" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto dark-scrollbar">
          {menuItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.label);
            const isActive = item.href ? pathname === item.href : false;
            const isSubItemActive = hasSubItems && item.subItems!.some(sub => pathname === sub.href);
            
            if (hasSubItems) {
              // Menu with sub-items
              const content = (
                <div key={item.label}>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "group flex items-center w-full rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 relative",
                      isSubItemActive
                        ? "bg-[#162754] text-white shadow-lg border border-white/10"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                      isSubItemActive ? "text-[#E8A020]" : "text-slate-400 group-hover:text-white"
                    )} />
                    {!isDesktopMini && (
                      <>
                        <span className="ml-3 truncate transition-all duration-300 flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronDown className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} />
                      </>
                    )}
                  </button>
                  
                  {/* Sub-items */}
                  {!isDesktopMini && isExpanded && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "block rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                              isSubActive
                                ? "bg-[#E8A020]/10 text-[#E8A020]"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );

              if (isDesktopMini) {
                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      {content}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#0F1C3F] border-white/10 text-white font-semibold text-xs">
                      <div className="space-y-1">
                        <div className="font-bold">{item.label}</div>
                        {item.subItems!.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="block text-xs text-slate-300 hover:text-white"
                          >
                            • {sub.label}
                          </Link>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return content;
            }

            // Regular menu item
            const content = (
              <Link
                key={item.href}
                href={item.href!}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 relative",
                  isActive 
                    ? "bg-[#162754] text-white shadow-lg border border-white/10" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                  isActive ? "text-[#E8A020]" : "text-slate-400 group-hover:text-white"
                )} />
                {!isDesktopMini && (
                  <>
                    <span className="ml-3 truncate transition-all duration-300 flex-1">
                      {item.label}
                    </span>
                    {/* Badge for Akun Terkunci */}
                    {item.label === "Akun Terkunci" && lockedCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-black bg-rose-500 hover:bg-rose-600 animate-pulse"
                      >
                        {lockedCount}
                      </Badge>
                    )}
                  </>
                )}
                {isActive && !isDesktopMini && item.label !== "Akun Terkunci" && (
                   <div className="ml-auto flex items-center justify-center">
                     <div className="h-1.5 w-1.5 rounded-full bg-[#E8A020] shadow-[0_0_8px_rgba(232,160,32,0.8)]" />
                   </div>
                )}
                {/* Badge for mini sidebar */}
                {isDesktopMini && item.label === "Akun Terkunci" && lockedCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-black text-white border-2 border-[#0F1C3F] animate-pulse">
                    {lockedCount > 9 ? '9+' : lockedCount}
                  </div>
                )}
              </Link>
            );

            if (isDesktopMini) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#0F1C3F] border-white/10 text-white font-semibold text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>
      </TooltipProvider>

      {/* Footer Info */}
      <div className={cn(
        "px-4 py-2 border-t border-white/5 bg-[#0A132D]",
        isDesktopMini && "px-2 items-center flex flex-col"
      )}>
        {isDesktopMini && (
          <div className="h-1 w-3 rounded-full bg-white/10" />
        )}
      </div>
    </div>
  );
};

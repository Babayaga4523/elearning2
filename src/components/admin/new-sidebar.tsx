"use client";

import React from "react";
import {
  Users,
  BookOpen,
  LayoutDashboard,
  Settings,
  History,
  Calendar,
  Lock,
  FileBarChart,
  GraduationCap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  ChevronDown,
  Shield,
  FolderTree,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermission } from "@/hooks/usePermission";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
  subItems?: { label: string; href: string; permission?: string }[];
  permission?: string;
  superAdminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "Manajemen Kursus",
    icon: BookOpen,
    href: "/admin/courses",
    permission: "manage_courses",
  },
  {
    label: "Kategori Kursus",
    icon: FolderTree,
    href: "/admin/categories",
    permission: "manage_courses",
  },
  {
    label: "Enrollment",
    icon: GraduationCap,
    href: "/admin/enrollments",
    permission: "manage_courses",
  },
  {
    label: "Karyawan",
    icon: Users,
    href: "/admin/users",
    permission: "manage_users",
  },
  {
    label: "Import Data",
    icon: Upload,
    href: "/admin/import",
    permission: "manage_users",
    subItems: [
      { label: "Import Soal", href: "/admin/import/questions", permission: "manage_courses" },
      { label: "Import Karyawan", href: "/admin/import/users", permission: "manage_users" },
      { label: "Import Enrollment", href: "/admin/import/enrollments", permission: "manage_courses" },
    ],
  },
  {
    label: "Analytics",
    icon: FileBarChart,
    permission: "view_course_reports",
    subItems: [
      { label: "Overview", href: "/admin/analytics", permission: "view_course_reports" },
      { label: "Progress Tracking", href: "/admin/analytics/progress", permission: "view_course_reports" },
    ],
  },
  {
    label: "Kalender",
    icon: Calendar,
    href: "/admin/calendar",
  },
  {
    label: "Scheduler",
    icon: Clock,
    href: "/admin/scheduler",
    permission: "manage_settings",
  },
  {
    label: "Log Sistem",
    icon: History,
    href: "/admin/logs",
    permission: "view_all_reports",
  },
  {
    label: "Akun Terkunci",
    icon: Lock,
    href: "/admin/locked-accounts",
    permission: "manage_users",
  },
  {
    label: "Kelola Permission",
    icon: Shield,
    href: "/admin/roles",
    superAdminOnly: true,
  },
];

interface NewSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function NewSidebar({ isCollapsed, onToggle }: NewSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const { hasPermission, isSuperAdmin, isLoading: permLoading } = usePermission();

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const visibleMenuItems = React.useMemo(() => {
    return menuItems.filter((item) => {
      if (item.superAdminOnly) {
        return isSuperAdmin;
      }
      if (!item.permission) {
        return true;
      }
      return hasPermission(item.permission);
    }).map((item) => {
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((sub) => {
          if (!sub.permission) return true;
          return hasPermission(sub.permission);
        });
        return { ...item, subItems: filteredSubItems };
      }
      return item;
    });
  }, [hasPermission, isSuperAdmin]);

  return (
    <div className="flex h-full flex-col bg-[#0F1C3F] border-r border-[#1A3060] shadow-xl">
      {/* Header */}
      <div className="flex h-24 items-center justify-between px-4 border-b border-white/10 bg-gradient-to-r from-[#0F1C3F] to-[#162754]">
        <Link
          href="/admin"
          className={cn(
            "flex group transition-all duration-300",
            isCollapsed ? "justify-center w-full" : "flex-col items-center gap-3 w-full"
          )}
        >
          {!isCollapsed ? (
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
              <div className="flex flex-col items-center leading-tight">
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

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Ciutkan sidebar"
            className="absolute top-2 right-2 h-7 w-7 rounded-lg hover:bg-white/10 border border-white/20 text-white hover:text-[#E8A020] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A020] focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3 dark-scrollbar">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-1">
            {visibleMenuItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.label);
              const isActive = item.href ? pathname === item.href : false;
              const isSubItemActive = hasSubItems && item.subItems!.some(sub => pathname === sub.href);
              const Icon = item.icon;

              if (hasSubItems) {
                const content = (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        "group flex items-center gap-3 w-full rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 relative",
                        isSubItemActive
                          ? "bg-[#162754] text-white shadow-lg border border-white/10"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                        isSubItemActive ? "text-[#E8A020]" : "text-slate-400 group-hover:text-white"
                      )} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate transition-all duration-300 text-left min-w-0">{item.label}</span>
                          <ChevronDown className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )} />
                        </>
                      )}
                    </button>

                    {!isCollapsed && isExpanded && (
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

                if (isCollapsed) {
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

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 relative",
                    isActive
                      ? "bg-[#162754] text-white shadow-lg border border-white/10"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-200 group-hover:scale-110",
                    isActive ? "text-[#E8A020]" : "text-slate-400 group-hover:text-white"
                  )} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate transition-all duration-300">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="h-1.5 w-1.5 rounded-full bg-[#E8A020] shadow-[0_0_8px_rgba(232,160,32,0.8)]" />
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#0F1C3F] border-white/10 text-white font-semibold text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 bg-[#0A132D]">
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Perluas sidebar"
            className="w-full h-9 rounded-lg hover:bg-white/10 border border-white/20 text-white hover:text-[#E8A020] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A020] focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
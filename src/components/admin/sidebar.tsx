"use client";

import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart2, 
  Settings,
  GraduationCap,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const routes = [
  {
    label: "Panel Utama",
    icon: LayoutDashboard,
    href: "/admin",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    label: "Katalog Kursus",
    icon: BookOpen,
    href: "/admin/courses",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  {
    label: "Enrollment",
    icon: GraduationCap,
    href: "/admin/enrollments",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Manajemen User",
    icon: Users,
    href: "/admin/users",
    color: "text-pink-700",
    bgColor: "bg-pink-700/10",
  },
  {
    label: "Laporan Data",
    icon: BarChart2,
    href: "/admin/analytics",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    label: "Notifikasi",
    icon: Bell,
    href: "/admin/notifications",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    label: "Pengaturan",
    icon: Settings,
    href: "/admin/settings",
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
  },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#0F1C3F] border-r border-slate-800">
      <div className="p-6 pt-8">
        <Link href="/admin" className="flex items-center gap-3 px-2 mb-10 group">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#E8A020] to-[#FFB732] flex items-center justify-center shadow-xl shadow-[#000]/20 group-hover:scale-110 transition-transform duration-500">
            <Building2 className="text-[#0F1C3F] h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white tracking-tighter leading-none">
              BNI FINANCE
            </h1>
            <p className="text-[10px] font-black text-[#E8A020]/60 tracking-widest uppercase mt-1">
              E-Learning Console
            </p>
          </div>
        </Link>

        <div className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "group flex items-center h-12 w-full px-4 rounded-xl transition-all duration-200",
                  isActive ? "bg-white/10" : "transparent hover:bg-white/5"
                )}
              >
                <div className="flex items-center flex-1">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center mr-3 transition-all",
                    isActive ? "bg-[#E8A020]/20" : "bg-transparent group-hover:bg-white/5"
                  )}>
                    <route.icon className={cn("h-4 w-4", isActive ? "text-[#E8A020]" : "text-slate-400 group-hover:text-slate-200")} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-all",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  )}>
                    {route.label}
                  </span>
                </div>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[#E8A020] shadow-[0_0_12px_rgba(232,160,32,0.8)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-[#E8A020]" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Keamanan Data</span>
          </div>
          <p className="text-[9px] font-medium text-slate-500 leading-relaxed">
            Sesi Anda dienkripsi dan dipantau secara berkala untuk kepatuhan BNI Finance.
          </p>
        </div>
        
        <button
          onClick={() => signOut()}
          className="flex items-center w-full h-12 px-4 rounded-xl text-slate-500 font-bold text-sm hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center mr-3 group-hover:bg-rose-500/20 transition-all">
            <LogOut className="h-4 w-4" />
          </div>
          Keluar Sesi
        </button>
      </div>
    </div>
  );
};

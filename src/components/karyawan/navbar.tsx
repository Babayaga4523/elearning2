import Link from "next/link";
import { BookOpen, History, Compass, LayoutDashboard, BarChart3 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 shadow-sm flex items-center justify-between px-6 md:px-12 transition-all">
      {/* Brand Logo */}
      <Link href="/dashboard" className="flex items-center gap-x-2 group">
        <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary transition-colors">
          <BookOpen className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
        </div>
        <span className="font-black text-slate-800 text-lg tracking-tight">BNIF LMS</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-x-8">
        <Link href="/dashboard" className="flex items-center gap-x-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link href="/courses" className="flex items-center gap-x-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
          <Compass className="h-4 w-4" />
          Explore Courses
        </Link>
        <Link href="/performance" className="flex items-center gap-x-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
          <BarChart3 className="h-4 w-4" />
          Performa
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-x-4">
        <LogoutButton className="h-10 px-4 text-sm bg-slate-50 border shadow-sm hidden sm:flex" />
      </div>
    </nav>
  );
};

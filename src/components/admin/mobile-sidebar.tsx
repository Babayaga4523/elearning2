"use client";

import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] transition-all animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white z-[101] shadow-2xl transition-transform duration-500 ease-out transform",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
      </div>
    </>
  );
};

"use client";

import { useSidebar } from "./sidebar-context";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function SidebarToggle({ className }: { className?: string }) {
  const { isDesktopMini, isMobileOpen, toggleDesktopSidebar, toggleMobileSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = isMobile ? isMobileOpen : isDesktopMini;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.innerWidth < 768) {
          toggleMobileSidebar();
        } else {
          toggleDesktopSidebar();
        }
      }}
      className={cn(
        // Responsive sizing - smaller and cleaner
        "h-8 w-8 md:h-9 md:w-9 rounded-lg transition-all duration-200 ease-out flex items-center justify-center",
        "bg-gradient-to-br from-[#0F1C3F] to-[#1A3060]",
        "border border-[#E8A020]/60 shadow-md shadow-[#E8A020]/20",
        "hover:from-[#162754] hover:to-[#1F3A75] hover:border-[#E8A020] hover:shadow-lg hover:shadow-[#E8A020]/30",
        "hover:scale-105 active:scale-95",
        isActive && "from-[#162754] to-[#1F3A75] border-[#E8A020] shadow-lg shadow-[#E8A020]/40",
        className
      )}
      aria-label="Toggle menu"
      type="button"
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-[2.5px] md:gap-[3px]">
        {/* Top Line */}
        <span
          className={cn(
            // Smaller, more refined lines
            "h-[2px] w-[14px] md:h-[2.5px] md:w-[16px] rounded-full transition-all duration-300 ease-out",
            "bg-[#E8A020] shadow-sm shadow-[#E8A020]/40",
            mounted && isActive && "translate-y-[4.5px] md:translate-y-[5.5px] rotate-45"
          )}
        />
        {/* Middle Line */}
        <span
          className={cn(
            "h-[2px] w-[14px] md:h-[2.5px] md:w-[16px] rounded-full transition-all duration-300 ease-out",
            "bg-[#E8A020] shadow-sm shadow-[#E8A020]/40",
            mounted && isActive ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
          )}
        />
        {/* Bottom Line */}
        <span
          className={cn(
            "h-[2px] w-[14px] md:h-[2.5px] md:w-[16px] rounded-full transition-all duration-300 ease-out",
            "bg-[#E8A020] shadow-sm shadow-[#E8A020]/40",
            mounted && isActive && "-translate-y-[4.5px] md:-translate-y-[5.5px] -rotate-45"
          )}
        />
      </div>
    </button>
  );
}

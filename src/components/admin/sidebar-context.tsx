"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type SidebarContextType = {
  isDesktopMini: boolean;
  isMobileOpen: boolean;
  toggleDesktopSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ 
  children, 
  initialCollapsed = false 
}: { 
  children: React.ReactNode; 
  initialCollapsed?: boolean 
}) {
  const [isDesktopMini, setIsDesktopMini] = useState(false); // Always start expanded
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsDesktopMini((prev) => {
      const newState = !prev;
      document.cookie = `sidebar-collapsed=${newState}; path=/; max-age=31536000`;
      return newState;
    });
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => {
      const newState = !prev;
      console.log("[Sidebar] Mobile toggle:", newState);
      return newState;
    });
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => {
      if (prev) {
        console.log("[Sidebar] Closing mobile");
        return false;
      }
      return prev;
    });
  }, []);

  // Tutup sidebar mobile otomatis jika layar di-resize ke desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        closeMobileSidebar();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMobileSidebar]);

  return (
    <SidebarContext.Provider
      value={{
        isDesktopMini,
        isMobileOpen,
        toggleDesktopSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
};

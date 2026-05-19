"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { NewSidebar } from "./new-sidebar";
import { AdminNavbar } from "./admin-navbar";
import { MobileNav } from "./mobile-nav";

interface NewAdminLayoutProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export function NewAdminLayout({
  children,
  userName,
  userEmail,
}: NewAdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-100">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col transition-all duration-300 ease-in-out shadow-xl",
          isSidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        <NewSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4 gap-3 shadow-sm z-10">
          {/* Mobile Menu */}
          <MobileNav
            isOpen={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          />

          {/* Navbar Content */}
          <div className="flex-1">
            <AdminNavbar userName={userName} userEmail={userEmail} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
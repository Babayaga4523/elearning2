"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/karyawan/navbar";

interface KaryawanLayoutClientProps {
  children: React.ReactNode;
  user?: {
    name: string | null;
    email: string | null;
    department: string | null;
    image: string | null;
  };
}

export function KaryawanLayoutClient({ children, user }: KaryawanLayoutClientProps) {
  const pathname = usePathname();
  
  // Hide navbar on module pages for immersive learning experience
  const isModulePage = pathname?.includes("/modules/");

  // If module page, render without navbar (fullscreen mode)
  if (isModulePage) {
    return <>{children}</>;
  }

  // Normal layout with navbar
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

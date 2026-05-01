import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/lib/suppress-hydration-warnings";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from "@/components/providers/session-provider";

// Validate environment variables at startup
import "@/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BNI Finance E-Learning | Advanced LMS",
  description: "A premium full-stack learning management system for BNI Finance employees.",
  icons: {
    icon: "/admin-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <SessionProvider>
          <Toaster position="top-right" />
          <SonnerToaster richColors position="top-right" />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

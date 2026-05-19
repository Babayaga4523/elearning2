import React from "react";
import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import "@/lib/suppress-hydration-warnings";
import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from "@/components/providers/session-provider";

// Validate environment variables at startup
import "@/lib/env";

// Primary font: Inter (with fallbacks to system fonts if Google Fonts fails)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
  variable: "--font-inter",
  preload: false, // Disable preload to prevent blocking on font fetch failure
});

// Secondary font for headings
const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-lexend",
  preload: false,
});

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
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${lexend.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <Toaster position="top-right" />
          <SonnerToaster richColors position="top-right" />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

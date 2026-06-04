/**
 * Admin Analytics - Progress Tracking Dashboard
 * Shows video and PDF progress analytics
 */

import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-helpers";
import { ProgressAnalyticsClient } from "./_components/ProgressAnalyticsClient";

export const metadata: Metadata = {
  title: "Progress Analytics | Admin Dashboard",
  description: "Monitor video and PDF progress across all users",
};

export default async function ProgressAnalyticsPage() {
  // Auth check - require admin role
  const session = await requireAdmin();
  if ("success" in session) {
    throw new Error(session.error);
  }

  return <ProgressAnalyticsClient />;
}

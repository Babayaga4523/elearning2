/**
 * Admin Analytics - Progress Tracking Dashboard
 * Shows video and PDF progress analytics
 */

import { Metadata } from "next";
import { ProgressAnalyticsClient } from "./_components/ProgressAnalyticsClient";

export const metadata: Metadata = {
  title: "Progress Analytics | Admin Dashboard",
  description: "Monitor video and PDF progress across all users",
};

export default function ProgressAnalyticsPage() {
  return <ProgressAnalyticsClient />;
}

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SchedulerMonitoringClient } from "./_components/SchedulerMonitoringClient";

export const metadata: Metadata = {
  title: "Scheduler Monitoring | Admin",
  description: "Monitor scheduler jobs and logs",
};

export default async function SchedulerMonitoringPage() {
  const session = await auth();

  // Admin layout already handles authorization, but double-check
  if (!session || (session.user.activeRole !== "ADMIN" && session.user.activeRole !== "SUPER_ADMIN")) {
    redirect("/");
  }

  return <SchedulerMonitoringClient />;
}

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { LogsClient } from "@/components/admin/LogsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Log Sistem | Admin Console",
  description: "Riwayat eksekusi cron job dan pendaftaran kursus.",
};

export default async function AdminLogsPage() {
  // Strict admin auth check
  const session = await requireAdmin();
  if ("success" in session) {
    throw new Error(session.error);
  }

  // Fetch the latest 500 scheduler logs from the database
  const logs = await db.schedulerLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
  });

  // Format to match the LogEntry interface in your LogsClient component
  const formattedLogs = logs.map((log) => ({
    id: log.id,
    jobName: log.jobName,
    status: log.status,
    message: log.message,
    duration: log.duration,
    createdAt: log.createdAt.toISOString(),
    failedRecipients: log.failedRecipients,
    // Safely infer the source based on jobName or metadata properties
    source: (log.metadata as any)?.source || (log.jobName === "ENROLLMENT_ACTIVITY" ? "ENROLLMENT" : "SCHEDULER"),
  }));

  return <LogsClient logs={formattedLogs as any} />;
}

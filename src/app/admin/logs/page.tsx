import { db } from "@/lib/db";
import { LogsClient } from "@/components/admin/LogsClient";

export default async function LogsPage() {
  const logs = await (db as any).schedulerLog.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 500 // Limit to avoid massive payloads
  });

  return (
    <div className="w-full">
      <LogsClient logs={logs} />
    </div>
  );
}

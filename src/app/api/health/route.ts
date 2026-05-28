import { headers } from "next/headers";

export async function GET() {
  const headersList = headers();
  const authHeader = headersList.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "elearning-app"
  });
}

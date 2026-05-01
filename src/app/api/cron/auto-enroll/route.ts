import { NextResponse } from "next/server";
import { runAutoEnrollment } from "@/lib/scheduler";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  
  // Security Check: Bearer Token
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const results = await runAutoEnrollment();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

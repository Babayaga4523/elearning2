import { NextResponse } from "next/server";
import { generateDepartmentExcel } from "@/lib/scheduler";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";
import { log } from "@/lib/logger";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    log.error("[REPORTS_DOWNLOAD] Unauthorized access attempt", {
      email: session?.user?.email,
      activeRole: session?.user?.activeRole,
      context: "api",
    });
    return new NextResponse("Unauthorized - Admin access required", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");

  // Input validation
  if (!department || typeof department !== "string") {
    return new NextResponse("Department name is required", { status: 400 });
  }

  // Sanitize department name for filename
  const sanitizedDept = department.slice(0, 100).replace(/[<>:"/\\|?*]/g, "_");

  if (sanitizedDept.length === 0) {
    return new NextResponse("Invalid department name", { status: 400 });
  }

  try {
    const workbook = await generateDepartmentExcel(sanitizedDept);
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="REKAP_${sanitizedDept.toUpperCase().replace(/\s/g, "_")}.xlsx"`,
      },
    });
  } catch (err: any) {
    log.error("[REPORTS_DOWNLOAD] Failed to generate report", {
      context: "api",
      department: sanitizedDept,
      error: err.message,
    });
    return new NextResponse("Failed to generate report", { status: 500 });
  }
}

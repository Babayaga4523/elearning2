import { NextResponse } from "next/server";
import { generateDepartmentExcel } from "@/lib/scheduler";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");

  if (!department) {
    return new NextResponse("Department name is required", { status: 400 });
  }

  try {
    const workbook = await generateDepartmentExcel(department);
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="REKAP_${department.toUpperCase().replace(/\s/g, "_")}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("Download Error:", err);
    return new NextResponse("Failed to generate report", { status: 500 });
  }
}

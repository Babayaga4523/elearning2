import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EnrollmentStatus, TestType } from "@prisma/client";

export async function GET() {
  const session = await auth();
  
  if (!session || session.user?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const enrollments = await db.enrollment.findMany({
    include: {
      user: { select: { name: true, email: true, department: true } },
      course: { select: { title: true } },
    },
  });

  const testAttempts = await db.testAttempt.findMany({
    include: {
      test: {
        select: {
          type: true,
          courseId: true,
        }
      }
    }
  });

  // Header CSV
  const headers = [
    "Nama Karyawan",
    "Email",
    "Departemen",
    "Nama Kursus",
    "Status",
    "Nilai Pre Test",
    "Nilai Post Test",
    "Lulus",
    "Tanggal Update",
  ];

  const rows = enrollments.map((e) => {
    const preTest = testAttempts.find(a => 
      a.userId === e.userId && 
      a.test.courseId === e.courseId && 
      a.test.type === TestType.PRE
    );
    
    const postTest = testAttempts.find(a => 
      a.userId === e.userId && 
      a.test.courseId === e.courseId && 
      a.test.type === TestType.POST
    );

    return [
      e.user.name || "Anonymous",
      e.user.email || "-",
      e.user.department ?? "-",
      e.course.title,
      e.status,
      preTest?.score?.toString() ?? "-",
      postTest?.score?.toString() ?? "-",
      postTest?.passed ? "Ya" : postTest ? "Tidak" : "-",
      e.updatedAt ? new Date(e.updatedAt).toLocaleDateString("id-ID") : "-",
    ];
  });

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-lms-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

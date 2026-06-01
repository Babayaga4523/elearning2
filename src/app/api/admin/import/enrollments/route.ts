import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseEnrollmentsExcel } from "@/lib/excel-import";
import { log } from "@/lib/logger";
import { rateLimit, rateLimitResponse, RateLimitPresets } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, RateLimitPresets.UPLOAD);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Auth check using new multi-role system
    const session = await auth();
    if (!isAdmin(session)) {
      log.error("Unauthorized enrollments import attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
      });
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sendNotification = formData.get("sendNotification") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // File validation
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "Only Excel files (.xlsx, .xls) are allowed" }, { status: 400 });
    }

    // Parse Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const parseResult = await parseEnrollmentsExcel(buffer);

    if (!parseResult.success || !parseResult.data) {
      log.warn("Enrollments import failed", { errors: parseResult.errors });
      return NextResponse.json(
        { error: "Failed to parse Excel file", details: parseResult.errors },
        { status: 400 }
      );
    }

    const enrollments = parseResult.data;

    // Validate row limit
    if (enrollments.length > 1000) {
      return NextResponse.json(
        { error: "Too many enrollments (max 1000 per import)" },
        { status: 400 }
      );
    }

    // Get all users and courses
    const emails = [...new Set(enrollments.map((e) => e.email))];
    const courseTitles = [...new Set(enrollments.map((e) => e.courseTitle))];

    const [users, courses] = await Promise.all([
      db.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true, name: true },
      }),
      db.course.findMany({
        where: { title: { in: courseTitles } },
        select: { id: true, title: true, deadlineDuration: true },
      }),
    ]);

    // Create lookup maps
    const userMap = new Map(users.map((u) => [u.email, u]));
    const courseMap = new Map(courses.map((c) => [c.title, c]));

    // Validate and prepare enrollments
    const validEnrollments: Array<{
      userId: string;
      courseId: string;
      deadline: Date | null;
      userName: string | null;
      courseTitle: string;
    }> = [];
    const errors: string[] = [];

    for (let i = 0; i < enrollments.length; i++) {
      const e = enrollments[i];
      const user = userMap.get(e.email);
      const course = courseMap.get(e.courseTitle);

      if (!user) {
        errors.push(`Row ${i + 2}: User not found (${e.email})`);
        continue;
      }

      if (!course) {
        errors.push(`Row ${i + 2}: Course not found (${e.courseTitle})`);
        continue;
      }

      // Check if already enrolled
      const existing = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });

      if (existing) {
        errors.push(`Row ${i + 2}: User already enrolled (${e.email} in ${e.courseTitle})`);
        continue;
      }

      // Calculate deadline
      let deadline: Date | null = null;
      if (e.deadline) {
        deadline = new Date(e.deadline);
      } else if (course.deadlineDuration) {
        deadline = new Date();
        deadline.setDate(deadline.getDate() + course.deadlineDuration);
      }

      validEnrollments.push({
        userId: user.id,
        courseId: course.id,
        deadline,
        userName: user.name,
        courseTitle: course.title,
      });
    }

    if (validEnrollments.length === 0) {
      return NextResponse.json(
        { error: "No valid enrollments to import", details: errors },
        { status: 400 }
      );
    }

    // Batch insert with transaction
    const result = await db.$transaction(async (tx) => {
      const created = [];

      for (const e of validEnrollments) {
        const enrollment = await tx.enrollment.create({
          data: {
            userId: e.userId,
            courseId: e.courseId,
            status: "IN_PROGRESS",
            deadline: e.deadline,
            source: "BULK_IMPORT",
          },
        });

        // Create notification
        if (sendNotification) {
          await tx.notification.create({
            data: {
              userId: e.userId,
              type: "ENROLLMENT",
              title: "Anda Terdaftar di Kursus Baru",
              body: `Anda telah didaftarkan ke kursus "${e.courseTitle}". ${
                e.deadline
                  ? `Deadline: ${e.deadline.toLocaleDateString("id-ID")}`
                  : ""
              }`,
              href: `/courses`,
            },
          });
        }

        created.push(enrollment);
      }

      return created;
    });

    log.info("Enrollments imported successfully", {
      count: result.length,
      errors: errors.length,
      adminId: session?.user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.length} enrollments`,
      count: result.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    log.error("Enrollments import error", {
      context: "api",
      adminId: (await auth())?.user?.id,
      error: String(error),
      stack: error?.stack,
    });
    // Return generic message to client (don't leak internal details)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

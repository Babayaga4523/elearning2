/**
 * API Route: Struggling Users Analytics
 * GET /api/admin/analytics/struggling-users
 * Admin-only endpoint to identify users who are struggling with courses
 *
 * FIXES:
 * - Eliminated N+1 query problem (was: 3 queries per enrollment, now: 5 total)
 * - Added input validation for daysThreshold and progressThreshold
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { isAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    // Check admin role
    if (!isAdmin(session)) {
      log.error("Unauthorized access attempt to struggling users analytics", {
        email: session.user.email,
        activeRole: session.user.activeRole,
        context: "api",
      });
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId") || undefined;
    const department = searchParams.get("department") || undefined;

    const daysThreshold = parseInt(searchParams.get("days") || "7");
    if (isNaN(daysThreshold) || daysThreshold < 1 || daysThreshold > 365) {
      return NextResponse.json(
        { success: false, error: "Parameter 'days' harus berupa angka antara 1-365." },
        { status: 400 }
      );
    }

    const progressThreshold = parseFloat(searchParams.get("progress") || "50");
    if (isNaN(progressThreshold) || progressThreshold < 0 || progressThreshold > 100) {
      return NextResponse.json(
        { success: false, error: "Parameter 'progress' harus berupa angka antara 0-100." },
        { status: 400 }
      );
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    // Build where clause for enrollments
    const whereClause: Record<string, unknown> = {
      createdAt: { lte: cutoffDate },
      status: "IN_PROGRESS",
    };

    if (courseId) whereClause.courseId = courseId;
    if (department) whereClause.user = { department };

    // ─── STEP 1: Fetch all matching enrollments (single query) ───────────────
    const enrollments = await db.enrollment.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
        course: {
          select: {
            id: true,
            title: true,
            modules: {
              select: { id: true, title: true, type: true },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          count: 0,
          users: [],
          filters: { daysThreshold, progressThreshold, courseId, department },
        },
      });
    }

    // ─── STEP 2: Batch-fetch all UserProgress (single query) ─────────────────
    const allModuleIds = [
      ...new Set(enrollments.flatMap((e) => e.course.modules.map((m) => m.id))),
    ];
    const allUserIds = [...new Set(enrollments.map((e) => e.userId))];

    const allUserProgressList = await db.userProgress.findMany({
      where: {
        userId: { in: allUserIds },
        moduleId: { in: allModuleIds },
      },
      select: { userId: true, moduleId: true, isCompleted: true },
    });

    // Build O(1) lookup map: "userId:moduleId" → isCompleted
    const progressMap = new Map<string, boolean>();
    for (const up of allUserProgressList) {
      progressMap.set(`${up.userId}:${up.moduleId}`, up.isCompleted);
    }

    // ─── STEP 3: Identify struggling users without extra queries ─────────────
    type StrugglingEntry = {
      enrollment: (typeof enrollments)[0];
      completionRate: number;
      completedModules: number;
      totalModules: number;
      incompleteModule: { id: string; title: string; type: string } | undefined;
    };

    const strugglingEntries: StrugglingEntry[] = [];

    for (const enrollment of enrollments) {
      const { modules } = enrollment.course;
      const totalModules = modules.length;
      if (totalModules === 0) continue;

      const completedModules = modules.filter(
        (m) => progressMap.get(`${enrollment.userId}:${m.id}`) === true
      ).length;

      const completionRate = (completedModules / totalModules) * 100;

      if (completionRate < progressThreshold) {
        const incompleteModule = modules.find(
          (m) => !progressMap.get(`${enrollment.userId}:${m.id}`)
        );

        strugglingEntries.push({
          enrollment,
          completionRate,
          completedModules,
          totalModules,
          incompleteModule,
        });
      }
    }

    // ─── STEP 4: Batch-fetch video & PDF progress for stuck modules ──────────
    const videoStuck = strugglingEntries.filter(
      (s) => s.incompleteModule?.type === "VIDEO"
    );
    const pdfStuck = strugglingEntries.filter(
      (s) => s.incompleteModule?.type === "PDF"
    );

    const videoModuleIds = [...new Set(videoStuck.map((s) => s.incompleteModule!.id))];
    const pdfModuleIds = [...new Set(pdfStuck.map((s) => s.incompleteModule!.id))];
    const stuckUserIds = [...new Set(strugglingEntries.map((s) => s.enrollment.userId))];

    const [videoProgressList, pdfProgressList] = await Promise.all([
      videoModuleIds.length > 0
        ? db.videoProgress.findMany({
            where: {
              userId: { in: stuckUserIds },
              moduleId: { in: videoModuleIds },
            },
            select: { userId: true, moduleId: true, completionRate: true },
          })
        : Promise.resolve([]),
      pdfModuleIds.length > 0
        ? db.pDFProgress.findMany({
            where: {
              userId: { in: stuckUserIds },
              moduleId: { in: pdfModuleIds },
            },
            select: { userId: true, moduleId: true, completionRate: true },
          })
        : Promise.resolve([]),
    ]);

    // Build lookup maps for video & PDF progress
    const videoProgressMap = new Map<string, number>();
    for (const vp of videoProgressList) {
      videoProgressMap.set(`${vp.userId}:${vp.moduleId}`, vp.completionRate);
    }
    const pdfProgressMap = new Map<string, number>();
    for (const pp of pdfProgressList) {
      pdfProgressMap.set(`${pp.userId}:${pp.moduleId}`, pp.completionRate);
    }

    // ─── STEP 5: Build final result ──────────────────────────────────────────
    const strugglingUsers = strugglingEntries.map(
      ({ enrollment, completionRate, completedModules, totalModules, incompleteModule }) => {
        let stuckModuleProgress = 0;

        if (incompleteModule) {
          const key = `${enrollment.userId}:${incompleteModule.id}`;
          stuckModuleProgress =
            incompleteModule.type === "VIDEO"
              ? (videoProgressMap.get(key) ?? 0)
              : (pdfProgressMap.get(key) ?? 0);
        }

        const daysSinceEnrollment = Math.floor(
          (Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          userId: enrollment.user.id,
          userName: enrollment.user.name || "Unknown",
          email: enrollment.user.email || "",
          department: enrollment.user.department || "Unknown",
          courseId: enrollment.course.id,
          courseName: enrollment.course.title,
          enrolledDate: enrollment.createdAt.toISOString(),
          daysSinceEnrollment,
          completionRate: Math.round(completionRate * 10) / 10,
          completedModules,
          totalModules,
          stuckModule: incompleteModule
            ? {
                moduleId: incompleteModule.id,
                moduleName: incompleteModule.title,
                moduleType: incompleteModule.type,
                progress: Math.round(stuckModuleProgress * 10) / 10,
              }
            : null,
        };
      }
    );

    // Sort by days since enrollment (longest waiting first)
    strugglingUsers.sort((a, b) => b.daysSinceEnrollment - a.daysSinceEnrollment);

    return NextResponse.json({
      success: true,
      data: {
        count: strugglingUsers.length,
        users: strugglingUsers,
        filters: { daysThreshold, progressThreshold, courseId, department },
      },
    });
  } catch (error) {
    log.error("Failed to get struggling users analytics", {
      context: "api",
      error,
    });

    return NextResponse.json(
      { success: false, error: "Failed to get analytics. Please try again." },
      { status: 500 }
    );
  }
}

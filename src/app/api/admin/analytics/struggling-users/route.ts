/**
 * API Route: Struggling Users Analytics
 * GET /api/admin/analytics/struggling-users
 * Admin-only endpoint to identify users who are struggling with courses
 */

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
        {
          success: false,
          error: "Unauthorized. Please login.",
        },
        { status: 401 }
      );
    }

    // Check admin role using new multi-role system
    if (!isAdmin(session)) {
      log.error("Unauthorized access attempt to struggling users analytics", {
        email: session.user.email,
        activeRole: session.user.activeRole,
        context: "api"
      });
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden. Admin access required.",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId") || undefined;
    const department = searchParams.get("department") || undefined;
    const daysThreshold = parseInt(searchParams.get("days") || "7");
    const progressThreshold = parseFloat(searchParams.get("progress") || "50");

    // Get enrollments older than threshold
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const whereClause: any = {
      createdAt: {
        lte: cutoffDate,
      },
      status: "IN_PROGRESS",
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (department) {
      whereClause.user = {
        department,
      };
    }

    // Get enrollments with user and course data
    const enrollments = await db.enrollment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            modules: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // Calculate progress for each enrollment
    const strugglingUsers = [];

    for (const enrollment of enrollments) {
      const totalModules = enrollment.course.modules.length;
      if (totalModules === 0) continue;

      // Get completed modules
      const completedModules = await db.userProgress.count({
        where: {
          userId: enrollment.userId,
          moduleId: {
            in: enrollment.course.modules.map((m) => m.id),
          },
          isCompleted: true,
        },
      });

      const completionRate = (completedModules / totalModules) * 100;

      // Check if user is struggling
      if (completionRate < progressThreshold) {
        // Find the module they're stuck on
        const userProgress = await db.userProgress.findMany({
          where: {
            userId: enrollment.userId,
            moduleId: {
              in: enrollment.course.modules.map((m) => m.id),
            },
          },
          include: {
            module: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        });

        // Find first incomplete module
        const incompleteModule = enrollment.course.modules.find(
          (module) =>
            !userProgress.find(
              (up) => up.moduleId === module.id && up.isCompleted
            )
        );

        // Get video/PDF progress for stuck module
        let stuckModuleProgress = 0;
        if (incompleteModule) {
          if (incompleteModule.type === "VIDEO") {
            const videoProgress = await db.videoProgress.findUnique({
              where: {
                userId_moduleId: {
                  userId: enrollment.userId,
                  moduleId: incompleteModule.id,
                },
              },
            });
            stuckModuleProgress = videoProgress?.completionRate || 0;
          } else if (incompleteModule.type === "PDF") {
            const pdfProgress = await db.pDFProgress.findUnique({
              where: {
                userId_moduleId: {
                  userId: enrollment.userId,
                  moduleId: incompleteModule.id,
                },
              },
            });
            stuckModuleProgress = pdfProgress?.completionRate || 0;
          }
        }

        const daysSinceEnrollment = Math.floor(
          (Date.now() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        strugglingUsers.push({
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
        });
      }
    }

    // Sort by days since enrollment (descending)
    strugglingUsers.sort((a, b) => b.daysSinceEnrollment - a.daysSinceEnrollment);

    log.info("Struggling users analytics retrieved", {
      context: "api",
      adminId: session?.user?.id,
      count: strugglingUsers.length,
      filters: { courseId, department, daysThreshold, progressThreshold },
    });

    return NextResponse.json({
      success: true,
      data: {
        count: strugglingUsers.length,
        users: strugglingUsers,
        filters: {
          daysThreshold,
          progressThreshold,
          courseId,
          department,
        },
      },
    });
  } catch (error) {
    log.error("Failed to get struggling users analytics", {
      context: "api",
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get analytics. Please try again.",
      },
      { status: 500 }
    );
  }
}

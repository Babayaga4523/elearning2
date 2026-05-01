/**
 * API Route: Video Analytics
 * GET /api/admin/analytics/video
 * Admin-only endpoint for video progress analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { VideoProgressService } from "@/lib/services/video-progress.service";
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
      log.error("Unauthorized access attempt to video analytics", {
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
    const moduleId = searchParams.get("moduleId") || undefined;
    const department = searchParams.get("department") || undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;

    // Get analytics
    const analytics = await VideoProgressService.getAnalytics({
      courseId,
      moduleId,
      startDate,
      endDate,
      department,
    });

    log.info("Video analytics retrieved", {
      context: "api",
      adminId: session?.user?.id,
      filters: { courseId, moduleId, department },
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    log.error("Failed to get video analytics", {
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

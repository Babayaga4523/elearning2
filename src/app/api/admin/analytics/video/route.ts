/**
 * API Route: Video Analytics
 * GET /api/admin/analytics/video
 * Admin-only endpoint for video progress analytics
 */

export const dynamic = 'force-dynamic';

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

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId") || undefined;
    const moduleId = searchParams.get("moduleId") || undefined;
    const department = searchParams.get("department") || undefined;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Format startDate tidak valid." },
          { status: 400 }
        );
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Format endDate tidak valid." },
          { status: 400 }
        );
      }
    }

    // Get analytics
    const analytics = await VideoProgressService.getAnalytics({
      courseId,
      moduleId,
      startDate,
      endDate,
      department,
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

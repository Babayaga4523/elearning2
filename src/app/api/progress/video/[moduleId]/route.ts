/**
 * API Route: Get/Delete Video Progress
 * GET /api/progress/video/[moduleId]
 * DELETE /api/progress/video/[moduleId]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { VideoProgressService } from "@/lib/services/video-progress.service";
import { log } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
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

    const { moduleId } = params;

    // Get progress
    const progress = await VideoProgressService.getProgress(
      session.user.id,
      moduleId
    );

    if (!progress) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        currentTime: progress.currentTime,
        duration: progress.duration,
        completionRate: progress.completionRate,
        completed: progress.completed,
        lastWatched: progress.lastWatched.toISOString(),
        watchCount: progress.watchCount,
        totalWatchTime: progress.totalWatchTime,
      },
    });
  } catch (error) {
    log.error("Failed to get video progress via API", {
      context: "api",
      error,
      moduleId: params.moduleId,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get progress. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
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

    const { moduleId } = params;

    // Reset progress
    await VideoProgressService.resetProgress(session.user.id, moduleId);

    log.info("Video progress reset via API", {
      context: "api",
      userId: session.user.id,
      moduleId,
    });

    return NextResponse.json({
      success: true,
      message: "Progress reset successfully",
    });
  } catch (error) {
    log.error("Failed to reset video progress via API", {
      context: "api",
      error,
      moduleId: params.moduleId,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset progress. Please try again.",
      },
      { status: 500 }
    );
  }
}

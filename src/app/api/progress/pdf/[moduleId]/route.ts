/**
 * API Route: Get/Delete PDF Progress
 * GET /api/progress/pdf/[moduleId]
 * DELETE /api/progress/pdf/[moduleId]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PDFProgressService } from "@/lib/services/pdf-progress.service";
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
    const progress = await PDFProgressService.getProgress(
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
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        pagesViewed: progress.pagesViewed,
        scrollPosition: progress.scrollPosition,
        completionRate: progress.completionRate,
        completed: progress.completed,
        lastRead: progress.lastRead.toISOString(),
        readCount: progress.readCount,
        totalReadTime: progress.totalReadTime,
      },
    });
  } catch (error) {
    log.error("Failed to get PDF progress via API", {
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
    await PDFProgressService.resetProgress(session.user.id, moduleId);

    log.info("PDF progress reset via API", {
      context: "api",
      userId: session.user.id,
      moduleId,
    });

    return NextResponse.json({
      success: true,
      message: "Progress reset successfully",
    });
  } catch (error) {
    log.error("Failed to reset PDF progress via API", {
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

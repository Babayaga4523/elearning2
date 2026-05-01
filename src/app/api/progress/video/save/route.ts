/**
 * API Route: Save Video Progress
 * POST /api/progress/video/save
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { VideoProgressService } from "@/lib/services/video-progress.service";
import { log } from "@/lib/logger";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// Validation schema
const saveVideoProgressSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  currentTime: z.number().min(0, "Current time must be >= 0"),
  duration: z.number().min(0, "Duration must be >= 0"),
  watchTime: z.number().min(0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 100, // 100 requests per minute
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

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

    // Parse and validate request body
    const body = await request.json();
    const validation = saveVideoProgressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { moduleId, currentTime, duration, watchTime } = validation.data;

    // Save progress
    const progress = await VideoProgressService.saveProgress({
      userId: session.user.id,
      moduleId,
      currentTime,
      duration,
      watchTime,
    });

    log.info("Video progress saved via API", {
      context: "api",
      userId: session.user.id,
      moduleId,
      completionRate: progress.completionRate,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: progress.id,
        completionRate: progress.completionRate,
        completed: progress.completed,
        moduleCompleted: progress.completed, // Module was marked complete if video completed
      },
    });
  } catch (error) {
    log.error("Failed to save video progress via API", {
      context: "api",
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save progress. Please try again.",
      },
      { status: 500 }
    );
  }
}

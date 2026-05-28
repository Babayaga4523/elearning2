/**
 * API Route: Save PDF Progress
 * POST /api/progress/pdf/save
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PDFProgressService } from "@/lib/services/pdf-progress.service";
import { log } from "@/lib/logger";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";

// Validation schema
const savePDFProgressSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
  currentPage: z.number().int().min(1, "Current page must be >= 1"),
  totalPages: z.number().int().min(1, "Total pages must be >= 1"),
  scrollPosition: z.number().min(0).optional(),
  readTime: z.number().min(0).optional(),
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
    const validation = savePDFProgressSchema.safeParse(body);

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

    const { moduleId, currentPage, totalPages, scrollPosition, readTime } =
      validation.data;

    // Check if module is published
    const courseModule = await db.module.findUnique({
      where: { id: moduleId },
      select: { isPublished: true },
    });

    if (!courseModule || !courseModule.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot save progress for unpublished module",
        },
        { status: 403 }
      );
    }

    // Save progress
    const progress = await PDFProgressService.saveProgress({
      userId: session.user.id,
      moduleId,
      currentPage,
      totalPages,
      scrollPosition,
      readTime,
    });

    log.info("PDF progress saved via API", {
      context: "api",
      userId: session.user.id,
      moduleId,
      currentPage,
      completionRate: progress.completionRate,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: progress.id,
        completionRate: progress.completionRate,
        completed: progress.completed,
        moduleCompleted: progress.completed, // Module was marked complete if PDF completed
      },
    });
  } catch (error) {
    log.error("Failed to save PDF progress via API", {
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

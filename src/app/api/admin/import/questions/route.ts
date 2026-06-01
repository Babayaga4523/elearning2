import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseQuestionsExcel } from "@/lib/excel-import";
import { log } from "@/lib/logger";
import { rateLimit, rateLimitResponse, RateLimitPresets } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  let testId: string | null = null;

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, RateLimitPresets.UPLOAD);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Auth check using new multi-role system
    const session = await auth();
    if (!isAdmin(session)) {
      log.error("Unauthorized questions import attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
      });
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    testId = formData.get("testId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
    }

    // Verify test exists and belongs to admin
    const test = await db.test.findUnique({
      where: { id: testId },
      include: { course: { select: { userId: true } } },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
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
    const parseResult = await parseQuestionsExcel(buffer);

    if (!parseResult.success || !parseResult.data) {
      log.warn("Questions import failed", { errors: parseResult.errors });
      return NextResponse.json(
        { error: "Failed to parse Excel file", details: parseResult.errors },
        { status: 400 }
      );
    }

    const questions = parseResult.data;

    // Validate row limit
    if (questions.length > 1000) {
      return NextResponse.json(
        { error: "Too many questions (max 1000 per import)" },
        { status: 400 }
      );
    }

    // Batch insert with transaction
    const result = await db.$transaction(async (tx) => {
      const createdQuestions = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question = await tx.question.create({
          data: {
            text: q.questionText,
            testId: testId!,
            position: i,
          },
        });

        // Create options with position preserved
        const options = [
          { text: q.option1, isCorrect: q.correctOption === 1, position: 0 },
          { text: q.option2, isCorrect: q.correctOption === 2, position: 1 },
          { text: q.option3, isCorrect: q.correctOption === 3, position: 2 },
          { text: q.option4, isCorrect: q.correctOption === 4, position: 3 },
        ];

        await tx.option.createMany({
          data: options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            questionId: question.id,
            position: opt.position,
          })),
        });

        createdQuestions.push(question);
      }

      return createdQuestions;
    });

    log.info("Questions imported successfully", {
      testId,
      count: result.length,
      adminId: session?.user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.length} questions`,
      count: result.length,
    });
  } catch (error: any) {
    log.error("Questions import error", {
      context: "api",
      testId: testId,
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
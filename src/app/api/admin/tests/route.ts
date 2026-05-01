import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { isAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      log.error("Unauthorized access attempt to admin tests", { 
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
        context: "api" 
      });
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Fetch all tests with course info
    const tests = await db.test.findMany({
      select: {
        id: true,
        title: true,
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedTests = tests.map((test) => ({
      id: test.id,
      title: test.title,
      courseTitle: test.course.title,
    }));

    return NextResponse.json(formattedTests);
  } catch (error) {
    log.error("Failed to fetch tests", { error, context: "api" });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

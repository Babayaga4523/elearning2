import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Placeholder API route for course reports.
 * Currently, course reports are handled client-side for better performance and customization.
 */
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: { title: true }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    return NextResponse.json({ 
      message: "API report for this course is available, but please use the UI 'Export' button for the full Excel report.",
      courseTitle: course.title
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

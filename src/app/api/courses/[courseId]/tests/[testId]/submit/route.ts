import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitTest } from "@/actions/test";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; testId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { answers, forceSubmit } = body;

    if (!answers || !Array.isArray(answers)) {
      return new NextResponse("Invalid answers format", { status: 400 });
    }

    // Call existing server action for robust scoring and atomic transaction
    const attempt = await submitTest(params.testId, answers, undefined, forceSubmit);

    return NextResponse.json({ attemptId: attempt.id });
  } catch (error: any) {
    console.error("[TEST_SUBMIT_ERROR]", error);
    
    // Handle known error messages from submitTest action
    if (error.message === "TEST_ALREADY_PASSED") {
      return new NextResponse("You have already passed this test.", { status: 403 });
    }
    if (error.message === "MAX_ATTEMPTS_REACHED") {
      return new NextResponse("Maximum attempts reached.", { status: 403 });
    }
    if (error.message === "MODULES_NOT_COMPLETED") {
      return new NextResponse("Prerequisite modules not completed.", { status: 403 });
    }

    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}

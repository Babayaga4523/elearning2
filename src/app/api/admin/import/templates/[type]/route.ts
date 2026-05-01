import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  generateQuestionsTemplate,
  generateUsersTemplate,
  generateEnrollmentsTemplate,
} from "@/lib/excel-import";
import { log } from "@/lib/logger";
import { isAdmin } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    // Auth check using new multi-role system
    const session = await auth();
    if (!isAdmin(session)) {
      log.error("Unauthorized template download attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
        type: params.type,
      });
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { type } = params;

    let buffer: Buffer;
    let filename: string;

    switch (type) {
      case "questions":
        buffer = await generateQuestionsTemplate();
        filename = "template_questions.xlsx";
        break;

      case "users":
        buffer = await generateUsersTemplate();
        filename = "template_users.xlsx";
        break;

      case "enrollments":
        buffer = await generateEnrollmentsTemplate();
        filename = "template_enrollments.xlsx";
        break;

      default:
        return NextResponse.json({ error: "Invalid template type" }, { status: 400 });
    }

    log.info("Template downloaded", { type, adminId: session?.user?.id });

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    log.error("Template download error", {
      error: error.message,
      type: params.type,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

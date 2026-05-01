import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseUsersExcel } from "@/lib/excel-import";
import { log } from "@/lib/logger";
import { rateLimit, rateLimitResponse, RateLimitPresets } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { isAdmin } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, RateLimitPresets.UPLOAD);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    // Auth check using new multi-role system
    const session = await auth();
    if (!isAdmin(session)) {
      log.error("Unauthorized users import attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
      });
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sendWelcomeEmail = formData.get("sendWelcomeEmail") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
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
    const parseResult = await parseUsersExcel(buffer);

    if (!parseResult.success || !parseResult.data) {
      log.warn("Users import failed", { errors: parseResult.errors });
      return NextResponse.json(
        { error: "Failed to parse Excel file", details: parseResult.errors },
        { status: 400 }
      );
    }

    const users = parseResult.data;

    // Validate row limit
    if (users.length > 1000) {
      return NextResponse.json(
        { error: "Too many users (max 1000 per import)" },
        { status: 400 }
      );
    }

    // Check for duplicates in Excel
    const emails = users.map((u) => u.email);
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: "Duplicate emails in Excel", details: duplicates },
        { status: 400 }
      );
    }

    // Check existing users
    const existingUsers = await db.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });

    const existingEmails = existingUsers.map((u) => u.email);
    const newUsers = users.filter((u) => !existingEmails.includes(u.email));

    if (newUsers.length === 0) {
      return NextResponse.json(
        { error: "All users already exist in database" },
        { status: 400 }
      );
    }

    // Batch insert with transaction
    const result = await db.$transaction(async (tx) => {
      const createdUsers = [];

      for (const u of newUsers) {
        // Generate password if not provided
        const password = u.password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await tx.user.create({
          data: {
            name: u.name,
            email: u.email,
            password: hashedPassword,
            nip: u.nip,
            department: u.department,
            lokasi: u.lokasi,
            role: "KARYAWAN",
          },
        });

        createdUsers.push({
          ...user,
          plainPassword: password, // For email
        });
      }

      return createdUsers;
    });

    // Send welcome emails (async, don't wait)
    if (sendWelcomeEmail) {
      // TODO: Implement email sending
      // This would be done in background job
      log.info("Welcome emails queued", { count: result.length });
    }

    log.info("Users imported successfully", {
      count: result.length,
      skipped: existingEmails.length,
      adminId: session?.user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${result.length} users`,
      count: result.length,
      skipped: existingEmails.length,
      skippedEmails: existingEmails,
    });
  } catch (error: any) {
    log.error("Users import error", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

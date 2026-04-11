import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await db.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  return NextResponse.json({ count });
}

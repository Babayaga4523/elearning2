// ─── Role Permissions API ───────────────────────────────────────
// GET:  Fetch all permissions with current ADMIN role assignments
// PUT:  Update ADMIN role permissions (Super Admin only)

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can view/edit role permissions
    const activeRole = session.user.activeRole || session.user.role;
    if (activeRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all permissions
    const permissions = await db.permission.findMany({
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });

    // Fetch current ADMIN role permissions
    const adminRolePermissions = await db.rolePermission.findMany({
      where: { role: "ADMIN" },
      select: { permissionId: true },
    });

    const adminPermissionIds = new Set(
      adminRolePermissions.map((rp) => rp.permissionId)
    );

    // Build response with assignment status
    const result = permissions.map((perm) => ({
      id: perm.id,
      key: perm.key,
      label: perm.label,
      description: perm.description,
      group: perm.group,
      isAssigned: adminPermissionIds.has(perm.id),
    }));

    return NextResponse.json({
      permissions: result,
      role: "ADMIN",
    });
  } catch (error) {
    console.error("[ROLE_PERMISSIONS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can modify role permissions
    const activeRole = session.user.activeRole || session.user.role;
    if (activeRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { permissionIds } = body as { permissionIds: string[] };

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: "permissionIds must be an array" },
        { status: 400 }
      );
    }

    // Validate that all permission IDs exist
    const existingPermissions = await db.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });

    const validIds = new Set(existingPermissions.map((p) => p.id));
    const invalidIds = permissionIds.filter((id) => !validIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid permission IDs: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    // Transaction: remove old ADMIN permissions, insert new ones
    await db.$transaction(async (tx) => {
      // Delete all existing ADMIN permissions
      await tx.rolePermission.deleteMany({
        where: { role: "ADMIN" },
      });

      // Insert new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            role: "ADMIN" as const,
            permissionId,
          })),
        });
      }
    });

    console.log(
      `[ROLE_PERMISSIONS] SUPER_ADMIN ${session.user.email} updated ADMIN permissions:`,
      permissionIds
    );

    return NextResponse.json({
      success: true,
      message: "Permission ADMIN berhasil diperbarui",
      assignedCount: permissionIds.length,
    });
  } catch (error) {
    console.error("[ROLE_PERMISSIONS_PUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

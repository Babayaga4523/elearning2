// ─── RBAC Server-Side Permission Helpers ────────────────────────
// Contains database operations for permission checks.
// DO NOT import this file in middleware (Edge Runtime).

import { db } from "@/lib/db";
import { ALL_PERMISSIONS } from "@/lib/permissions";

/**
 * Fetch permissions for a given role from the database.
 * SUPER_ADMIN always returns ALL permissions (hardcoded).
 * KARYAWAN always returns empty array.
 */
export async function getPermissionsForRole(role: string): Promise<string[]> {
  if (role === "SUPER_ADMIN") {
    return ALL_PERMISSIONS;
  }

  if (role === "KARYAWAN") {
    return [];
  }

  // ADMIN: fetch from database
  const rolePermissions = await db.rolePermission.findMany({
    where: { role: "ADMIN" },
    include: { permission: true },
  });

  return rolePermissions.map((rp) => rp.permission.key);
}

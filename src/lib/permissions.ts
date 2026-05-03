// ─── RBAC Permission Constants ──────────────────────────────────
// Pure constants with NO database imports.
// Safe to use in middleware (Edge Runtime).

// ─── All Permissions ────────────────────────────────────────────
export const PERMISSIONS = {
  MANAGE_COURSES: "manage_courses",
  VIEW_COURSE_REPORTS: "view_course_reports",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  VIEW_ALL_REPORTS: "view_all_reports",
  MANAGE_SETTINGS: "manage_settings",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Human-readable labels (used in seed & UI)
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  manage_courses: "Kelola Kursus",
  view_course_reports: "Laporan Kursus",
  manage_users: "Kelola User",
  manage_roles: "Kelola Role & Permission",
  view_all_reports: "Semua Laporan",
  manage_settings: "Pengaturan Sistem",
};

// Permission groups for UI grouping
export const PERMISSION_GROUPS: Record<PermissionKey, string> = {
  manage_courses: "Kursus",
  view_course_reports: "Laporan",
  manage_users: "User Management",
  manage_roles: "Sistem",
  view_all_reports: "Laporan",
  manage_settings: "Sistem",
};

// Default permissions for ADMIN role (assigned on seed)
export const DEFAULT_ADMIN_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.MANAGE_COURSES,
  PERMISSIONS.VIEW_COURSE_REPORTS,
];

// All permissions (used for SUPER_ADMIN full access)
export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

// ─── Route → Permission Mapping ─────────────────────────────────
// Maps admin routes to required permission(s).
// Routes not listed here are accessible to any admin role.
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  "/admin/courses": [PERMISSIONS.MANAGE_COURSES],
  "/admin/enrollments": [PERMISSIONS.MANAGE_COURSES],
  "/admin/analytics": [PERMISSIONS.VIEW_COURSE_REPORTS, PERMISSIONS.VIEW_ALL_REPORTS],
  "/admin/analytics/progress": [PERMISSIONS.VIEW_COURSE_REPORTS, PERMISSIONS.VIEW_ALL_REPORTS],
  "/admin/users": [PERMISSIONS.MANAGE_USERS],
  "/admin/import": [PERMISSIONS.MANAGE_USERS],
  "/admin/import/questions": [PERMISSIONS.MANAGE_COURSES],
  "/admin/import/users": [PERMISSIONS.MANAGE_USERS],
  "/admin/import/enrollments": [PERMISSIONS.MANAGE_COURSES],
  "/admin/roles": [PERMISSIONS.MANAGE_ROLES],
  "/admin/settings": [PERMISSIONS.MANAGE_SETTINGS],
  "/admin/scheduler": [PERMISSIONS.MANAGE_SETTINGS],
  "/admin/logs": [PERMISSIONS.VIEW_ALL_REPORTS],
  "/admin/locked-accounts": [PERMISSIONS.MANAGE_USERS],
};

// API route permission map
export const API_ROUTE_PERMISSION_MAP: Record<string, PermissionKey[]> = {
  "/api/admin/role-permissions": [PERMISSIONS.MANAGE_ROLES],
};

// ─── Pure Utility Functions (no DB) ─────────────────────────────

/**
 * Check if a route requires specific permissions and whether
 * the user's permissions satisfy the requirement.
 * Returns true if access is allowed.
 */
export function checkRoutePermission(
  pathname: string,
  userPermissions: string[]
): boolean {
  const sortedRoutes = Object.keys(ROUTE_PERMISSION_MAP).sort(
    (a, b) => b.length - a.length
  );

  for (const route of sortedRoutes) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      const requiredPermissions = ROUTE_PERMISSION_MAP[route];
      // User needs at least ONE of the required permissions
      return requiredPermissions.some((perm) =>
        userPermissions.includes(perm)
      );
    }
  }

  // No specific permission required — allow access
  return true;
}

/**
 * Check if user has a specific permission.
 */
export function hasPermission(
  userPermissions: string[],
  permission: PermissionKey
): boolean {
  return userPermissions.includes(permission);
}

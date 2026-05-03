"use client";

// ─── usePermission Hook ─────────────────────────────────────────
// Client-side hook for conditional rendering based on RBAC permissions.
// Reads permissions from the session.

import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

/**
 * Hook to check user permissions in client components.
 * 
 * Usage:
 * ```tsx
 * const { hasPermission, hasAnyPermission, isSuperAdmin } = usePermission();
 * 
 * if (hasPermission("manage_courses")) {
 *   // show course management UI
 * }
 * ```
 */
export function usePermission() {
  const { data: session, status } = useSession();

  const permissions: string[] = useMemo(
    () => session?.user?.permissions || [],
    [session?.user?.permissions]
  );

  const activeRole = session?.user?.activeRole || session?.user?.role;
  const isSuperAdmin = activeRole === "SUPER_ADMIN";
  const isAdmin = activeRole === "ADMIN" || isSuperAdmin;
  const isLoading = status === "loading";

  /**
   * Check if user has a specific permission.
   * SUPER_ADMIN always returns true.
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (isSuperAdmin) return true;
      return permissions.includes(permission);
    },
    [permissions, isSuperAdmin]
  );

  /**
   * Check if user has ANY of the given permissions.
   * SUPER_ADMIN always returns true.
   */
  const hasAnyPermission = useCallback(
    (requiredPermissions: string[]): boolean => {
      if (isSuperAdmin) return true;
      return requiredPermissions.some((perm) => permissions.includes(perm));
    },
    [permissions, isSuperAdmin]
  );

  /**
   * Check if user has ALL of the given permissions.
   * SUPER_ADMIN always returns true.
   */
  const hasAllPermissions = useCallback(
    (requiredPermissions: string[]): boolean => {
      if (isSuperAdmin) return true;
      return requiredPermissions.every((perm) => permissions.includes(perm));
    },
    [permissions, isSuperAdmin]
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isAdmin,
    isLoading,
    activeRole,
  };
}

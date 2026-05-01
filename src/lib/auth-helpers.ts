/**
 * Authentication & Authorization Helper Functions
 * 
 * Provides consistent authorization checks across the application
 * using the new multi-role system with activeRole.
 */

import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Check if user has admin access based on activeRole
 * 
 * @returns Session if authorized, or error object if not
 */
export async function requireAdmin() {
  const session = await auth();
  
  // Check if user is logged in
  if (!session?.user) {
    console.log("[AUTH_HELPER] No session found");
    return { 
      success: false as const, 
      error: "Unauthorized - Please login" 
    };
  }

  // Get user's roles and activeRole
  const activeRole = session.user.activeRole;
  const roles = session.user.roles || [];
  
  console.log("[AUTH_HELPER] Authorization check:", {
    email: session.user.email,
    activeRole,
    roles,
  });

  // User must have ADMIN or SUPER_ADMIN in their roles array
  const hasAdminAccess = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
  
  if (!hasAdminAccess) {
    console.log("[AUTH_HELPER] Access denied - User does not have admin role in roles array");
    return { 
      success: false as const, 
      error: "Unauthorized - Admin access required" 
    };
  }

  // User must have selected admin role as active
  if (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") {
    console.log("[AUTH_HELPER] Access denied - User must select admin role as active. Current activeRole:", activeRole);
    return { 
      success: false as const, 
      error: "Unauthorized - Please select admin role" 
    };
  }

  console.log("[AUTH_HELPER] Access granted for user:", session.user.email);
  return session;
}

/**
 * Check if current session has admin access (for API routes)
 * 
 * @param session - NextAuth session object
 * @returns true if user has admin access, false otherwise
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user) {
    return false;
  }

  const activeRole = session.user.activeRole;
  const roles = session.user.roles || [];

  // Must have admin role in roles array
  const hasAdminRole = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
  
  // Must have selected admin as active role
  const hasActiveAdminRole = activeRole === "ADMIN" || activeRole === "SUPER_ADMIN";

  return hasAdminRole && hasActiveAdminRole;
}

/**
 * Check if user has specific role in their roles array
 * 
 * @param session - NextAuth session object
 * @param role - Role to check
 * @returns true if user has the role
 */
export function hasRole(session: Session | null, role: "ADMIN" | "KARYAWAN" | "SUPER_ADMIN"): boolean {
  if (!session?.user) {
    return false;
  }

  const roles = session.user.roles || [];
  return roles.includes(role);
}

/**
 * Get current active role
 * 
 * @param session - NextAuth session object
 * @returns Current active role or null
 */
export function getActiveRole(session: Session | null): "ADMIN" | "KARYAWAN" | "SUPER_ADMIN" | null {
  return session?.user?.activeRole || null;
}

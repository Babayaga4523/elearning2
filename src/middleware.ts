import authConfig from "./auth.config";
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";
import { ROUTE_PERMISSION_MAP, API_ROUTE_PERMISSION_MAP } from "@/lib/permissions";

const { auth } = NextAuth(authConfig);

export default auth((req: any) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Always allow API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // Handle auth routes (login, register, etc.)
  if (isAuthRoute) {
    if (isLoggedIn) {
      // If user is logged in but locked, we allow them to access auth routes (specifically so they can log out or see error)
      if (req.auth?.user?.lockedAt) {
        return; 
      }
      // Allow /auth/login?check-role=true for role selection even when logged in
      if (nextUrl.pathname === "/auth/login" && nextUrl.searchParams.get("check-role") === "true") {
        return; // Allow access
      }
      // Otherwise redirect logged-in users away from auth pages
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return; // Allow unauthenticated users to access auth routes
  }

  // ─── CHECK FOR LOCKED ACCOUNT ──────────────────────────────────────────
  if (isLoggedIn && req.auth?.user?.lockedAt) {
    // If the user's account is locked by admin, redirect to signout 
    // to clear the session immediately.
    return Response.redirect(new URL("/api/auth/signout?callbackUrl=/auth/login?error=Locked", nextUrl));
  }

  // Require authentication for non-public routes
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // ─── RBAC: Permission-based route blocking for admin routes ───
  if (isLoggedIn && nextUrl.pathname.startsWith("/admin")) {
    const token = req.auth;
    const activeRole = token?.user?.activeRole || token?.user?.role;

    // SUPER_ADMIN bypasses all permission checks
    if (activeRole === "SUPER_ADMIN") {
      return;
    }

    // Permissions from JWT (case-insensitive)
    const permissions: string[] = (token?.user?.permissions || []).map((p: string) => p.toLowerCase());

    // Find matching route pattern (longest match first)
    const sortedRoutes = Object.keys(ROUTE_PERMISSION_MAP).sort(
      (a, b) => b.length - a.length
    );

    for (const route of sortedRoutes) {
      if (nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")) {
        const requiredPermissions = ROUTE_PERMISSION_MAP[route];
        // Case-insensitive permission check
        const hasAccess = requiredPermissions.some((perm) =>
          permissions.includes(perm.toLowerCase())
        );

        if (!hasAccess) {
          // Redirect to admin dashboard with error
          return Response.redirect(new URL("/admin?error=unauthorized", nextUrl));
        }
        break; // Found matching route, stop checking
      }
    }
  }

  // ─── RBAC: Permission-based API route blocking ────────────────
  if (isLoggedIn && nextUrl.pathname.startsWith("/api/admin/")) {
    const token = req.auth;
    const activeRole = token?.user?.activeRole || token?.user?.role;

    // SUPER_ADMIN bypasses all permission checks
    if (activeRole === "SUPER_ADMIN") {
      return;
    }

    // Permissions from JWT (case-insensitive)
    const permissions: string[] = (token?.user?.permissions || []).map((p: string) => p.toLowerCase());

    const sortedApiRoutes = Object.keys(API_ROUTE_PERMISSION_MAP).sort(
      (a, b) => b.length - a.length
    );

    for (const route of sortedApiRoutes) {
      if (nextUrl.pathname === route || nextUrl.pathname.startsWith(route + "/")) {
        const requiredPermissions = API_ROUTE_PERMISSION_MAP[route];
        // Case-insensitive permission check
        const hasAccess = requiredPermissions.some((perm) =>
          permissions.includes(perm.toLowerCase())
        );

        if (!hasAccess) {
          return new Response(
            JSON.stringify({ error: "Forbidden", message: "Anda tidak memiliki permission untuk mengakses resource ini." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        break;
      }
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

import type { NextAuthConfig } from "next-auth";

// ─── Lightweight Auth Config for Middleware (Edge Runtime) ──────
// This config is used by the middleware. It MUST NOT import any
// Node.js-only modules (Prisma, bcrypt, etc).
// The callbacks here only pass through JWT token data to the session
// — the actual data enrichment happens in auth.ts.

export default {
  providers: [],
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    // Pass JWT token fields to session so middleware can access them
    async session({ token, session }: any) {
      if (token?.sub && session?.user) {
        session.user.id = token.sub;
      }
      if (token?.role && session?.user) {
        session.user.role = token.role;
      }
      if (token?.roles && session?.user) {
        session.user.roles = token.roles;
      }
      if (token?.activeRole && session?.user) {
        session.user.activeRole = token.activeRole;
      }
      if (token?.lockedAt && session?.user) {
        session.user.lockedAt = token.lockedAt;
      }
      if (session?.user) {
        session.user.permissions = token?.permissions || [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

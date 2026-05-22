import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getPermissionsForRole } from "@/lib/permissions.server";

const authOptions: any = {
  ...authConfig,
  adapter: PrismaAdapter(db as any),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        // Move imports inside to avoid top-level evaluation issues in RSC
        const bcrypt = await import("bcryptjs");
        const { z } = await import("zod");
        
        const LoginSchema = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        });

        const validatedFields = LoginSchema.safeParse(credentials);

      if (validatedFields.success) {
        const { email, password } = validatedFields.data;

        const user = await db.user.findUnique({
          where: { email }
        });

        if (!user) {
          return null;
        }

        if (!user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          password,
          user.password,
        );

        if (passwordsMatch) {
          return user;
        } else {
          return null;
        }
      } else {
        return null;
      }
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "microsoft-entra-id") {
        const email = user.email!;
        const allowedDomain = process.env.ALLOWED_DOMAIN || "bnif.co.id";

        // 1. Defense in Depth: Domain Validation
        if (!email.endsWith(`@${allowedDomain}`)) {
          return false;
        }

        // 2. JIT Provisioning (User Creation/Update)
        const existingUser = await db.user.findUnique({
          where: { email }
        });

        if (!existingUser) {
          // Create new user with Microsoft auth
          await db.user.create({
            data: {
              email,
              name: profile?.name ?? user.name ?? "",
              image: user.image ?? null,
              roles: ["KARYAWAN"], // Default role for new users
              authMethod: "MICROSOFT",
              lastLoginAt: new Date(),
              lastLoginMethod: "MICROSOFT",
              password: null, // SSO user has no local password
            }
          });
        } else {
          // Update existing user's last login info
          await db.user.update({
            where: { email },
            data: {
              name: profile?.name ?? user.name ?? existingUser.name,
              image: user.image ?? existingUser.image,
              lastLoginAt: new Date(),
              lastLoginMethod: "MICROSOFT",
            }
          });
        }
      } else if (account?.provider === "credentials") {
        // Manual login - update last login info
        const email = user.email!;
        await db.user.update({
          where: { email },
          data: {
            lastLoginAt: new Date(),
            lastLoginMethod: "MANUAL",
          }
        });
      }
      return true;
    },
    async session({ token, session }: { token: any, session: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role;
      }
      if (token.roles && session.user) {
        session.user.roles = token.roles;
      }
      if (token.activeRole && session.user) {
        session.user.activeRole = token.activeRole;
      }
      if (token.nip && session.user) {
        session.user.nip = token.nip;
      }
      if (token.lockedAt && session.user) {
        session.user.lockedAt = token.lockedAt;
      }
      // Inject RBAC permissions into session
      if (session.user) {
        session.user.permissions = token.permissions || [];
      }
      return session;
    },
    async jwt({ token, trigger, session }: { token: any, trigger?: string, session?: any }) {
      // Handle session updates from update() method
      if (trigger === "update" && session) {
        if (session.activeRole) {
          token.activeRole = session.activeRole;
          // Re-fetch permissions when active role changes
          token.permissions = await getPermissionsForRole(session.activeRole);
        }
        if (session.roles) {
          token.roles = session.roles;
        }
        return token;
      }

      if (!token.sub) return token;
      
      // Fetch fresh data from DB to ensure roles are current
      const existingUser = await db.user.findUnique({
        where: { id: token.sub },
        select: { 
          id: true, 
          role: true, 
          roles: true, 
          activeRole: true,
          nip: true,
          lockedAt: true,
        },
      });

      if (existingUser) {
        token.sub = existingUser.id;
        token.role = existingUser.role; // Legacy field
        token.roles = existingUser.roles; // New multi-role field
        token.activeRole = existingUser.activeRole;
        token.nip = existingUser.nip;
        token.lockedAt = existingUser.lockedAt;

        // Resolve RBAC permissions based on active role
        const effectiveRole = existingUser.activeRole || existingUser.role;
        token.permissions = await getPermissionsForRole(effectiveRole);
      }
      
      return token;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);

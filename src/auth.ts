import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "./auth.config";

import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import * as z from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("[AUTH] authorize called for email:", credentials?.email);
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await db.user.findUnique({
            where: { email }
          });
          
          if (!user || !user.password) {
            console.log("[AUTH] user not found or no password for:", email);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) {
            console.log("[AUTH] success! passwords match for:", email);
            return user;
          }
          console.log("[AUTH] password mismatch for:", email);
        } else {
          console.log("[AUTH] validation failed for credentials");
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async session({ token, session }: { token: any, session: any }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as "ADMIN" | "KARYAWAN";
      }

      return session;
    },
    async jwt({ token }: { token: any }) {
      if (!token.sub) return token;

      // Only query the database if the role is not yet cached in the token.
      // This prevents a DB round-trip on EVERY request (page navigation, API call, etc).
      // The role is fetched once and stored in the JWT for the session lifetime.
      if (!token.role) {
        const existingUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true }, // Only select what we need
        });

        if (existingUser) {
          token.role = existingUser.role;
        }
      }

      return token;
    },
  },
});

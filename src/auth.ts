import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
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
          
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) return user;
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
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token }: { token: any }) {
      if (!token.sub) return token;
      if (!token.role) {
        const existingUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (existingUser) {
          token.role = existingUser.role;
        }
      }
      return token;
    },
  },
});

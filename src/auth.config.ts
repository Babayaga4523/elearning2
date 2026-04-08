import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default {
  providers: [], // Providers moved to auth.ts to avoid edge-runtime issues with Prisma
} satisfies NextAuthConfig;

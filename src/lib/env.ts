/**
 * Environment Variables Validation
 * Validates all required environment variables at startup
 * Prevents runtime crashes due to missing configuration
 */

import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => url.includes("postgresql://"),
      "DATABASE_URL must be a PostgreSQL connection string"
    ),

  // NextAuth
  NEXTAUTH_URL: z
    .string()
    .url()
    .min(1, "NEXTAUTH_URL is required"),
  
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters for security")
    .refine(
      (secret) => !/^your-secret-key/.test(secret),
      "NEXTAUTH_SECRET must be changed from default value"
    ),

  // Email (SMTP)
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.string().regex(/^\d+$/, "SMTP_PORT must be a number"),
  SMTP_USER: z.string().email("SMTP_USER must be a valid email"),
  SMTP_PASS: z
    .string()
    .min(1, "SMTP_PASS is required")
    .refine(
      (pass) => !/^your-smtp-password/.test(pass),
      "SMTP_PASS must be changed from default value"
    ),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),

  // Cron Jobs Security
  CRON_SECRET: z
    .string()
    .min(32, "CRON_SECRET must be at least 32 characters for security")
    .refine(
      (secret) => !/^your-cron-secret/.test(secret),
      "CRON_SECRET must be changed from default value"
    ),

  // Optional: File Upload
  MAX_FILE_SIZE: z
    .string()
    .regex(/^\d+$/, "MAX_FILE_SIZE must be a number")
    .optional()
    .default("10485760"), // 10MB default

  // Node Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate and export typed environment variables
function validateEnv() {
  // Skip validation during build time (when env vars might not be available yet)
  if (process.env.SKIP_ENV_VALIDATION === "true" || process.env.NODE_ENV === "test") {
    console.log("⚠️  Environment validation skipped (build time or test mode)");
    return process.env as any;
  }

  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional runtime checks
    if (parsed.NODE_ENV === "production" && process.env.VERCEL) {
      // Ensure production-specific requirements (only on actual deployment platforms)
      if (parsed.NEXTAUTH_URL.includes("localhost")) {
        throw new Error(
          "NEXTAUTH_URL cannot use localhost in production. Use your production domain."
        );
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      console.error(JSON.stringify(error.errors, null, 2));
      
      // Show helpful error messages
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      
      console.error("\n💡 Please check your .env file and ensure all required variables are set.");
      console.error("📄 See .env.example for reference.\n");
    } else {
      console.error("❌ Environment validation error:", error);
    }
    
    // Only exit in production runtime (not during build)
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      process.exit(1);
    }
    
    // Return process.env as fallback for development
    console.warn("⚠️  Using process.env as fallback (some features may not work)");
    return process.env as any;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

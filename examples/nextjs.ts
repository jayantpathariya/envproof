/**
 * Example: Next.js Application
 *
 * This example shows how to use EnvKit with Next.js
 * Place this file at the root of your Next.js project as env.config.ts
 */

import { createEnv, e } from "../src/index.js";

// Define environment schema for a Next.js app
// Note: Next.js has both server and client environment variables
// EnvKit handles the server-side validation

export const env = createEnv({
  // Database
  DATABASE_URL: e
    .url()
    .description("Database connection string")
    .example("postgresql://user:pass@localhost:5432/mydb"),

  // Authentication
  NEXTAUTH_URL: e
    .url()
    .http()
    .optional()
    .description("NextAuth.js callback URL"),

  NEXTAUTH_SECRET: e
    .string()
    .minLength(32)
    .secret()
    .description("NextAuth.js secret for JWT signing"),

  // OAuth Providers
  GOOGLE_CLIENT_ID: e.string().optional().description("Google OAuth client ID"),

  GOOGLE_CLIENT_SECRET: e
    .string()
    .secret()
    .optional()
    .description("Google OAuth client secret"),

  GITHUB_CLIENT_ID: e.string().optional().description("GitHub OAuth client ID"),

  GITHUB_CLIENT_SECRET: e
    .string()
    .secret()
    .optional()
    .description("GitHub OAuth client secret"),

  // External APIs
  STRIPE_SECRET_KEY: e
    .string()
    .startsWith("sk_")
    .secret()
    .optional()
    .description("Stripe secret API key"),

  STRIPE_WEBHOOK_SECRET: e
    .string()
    .startsWith("whsec_")
    .secret()
    .optional()
    .description("Stripe webhook signing secret"),

  // Email
  SMTP_HOST: e.string().optional().description("SMTP server host"),

  SMTP_PORT: e.number().port().default(587).description("SMTP server port"),

  SMTP_USER: e.string().optional().description("SMTP username"),

  SMTP_PASS: e.string().secret().optional().description("SMTP password"),

  // Feature flags
  ENABLE_ANALYTICS: e
    .boolean()
    .default(true)
    .description("Enable analytics tracking"),

  ENABLE_DEBUG_MODE: e
    .boolean()
    .default(false)
    .description("Enable debug mode (development only)"),

  // Application
  APP_URL: e
    .url()
    .http()
    .description("Public application URL")
    .example("https://myapp.com"),
});

// Type-safe usage throughout your Next.js app:
/*
// In API routes
import { env } from '@/env.config';

export async function POST(request: Request) {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response('Payments not configured', { status: 503 });
  }
  
  // Use env.STRIPE_SECRET_KEY safely
}

// In server components
import { env } from '@/env.config';

export default function Page() {
  const showDebug = env.ENABLE_DEBUG_MODE;
  // ...
}
*/

console.log("Next.js environment configuration loaded!");
console.log("  APP_URL:", env.APP_URL.toString());
console.log("  Analytics enabled:", env.ENABLE_ANALYTICS);
console.log("  Debug mode:", env.ENABLE_DEBUG_MODE);

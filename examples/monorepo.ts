/**
 * Example: Monorepo / Shared Configuration
 *
 * This example shows how to share environment configuration
 * across multiple packages in a monorepo
 */

import { createEnv, e } from "../src/index.js";
import type { EnvSchema, InferEnv } from "../src/index.js";

// ============================================================
// Shared Base Configuration
// ============================================================

/**
 * Common environment variables used by all packages
 */
export const baseSchema = {
  // Application environment
  NODE_ENV: e
    .enum(["development", "test", "staging", "production"] as const)
    .description("Application environment"),

  // Logging
  LOG_LEVEL: e
    .enum(["trace", "debug", "info", "warn", "error", "fatal"] as const)
    .default("info")
    .description("Logging level"),

  // Feature flags
  ENABLE_ANALYTICS: e
    .boolean()
    .default(false)
    .description("Enable analytics tracking"),

  // Monitoring
  SENTRY_DSN: e.url().optional().secret().description("Sentry error tracking"),

  // Deployment info
  APP_VERSION: e
    .string()
    .optional()
    .description("Application version from CI/CD"),

  COMMIT_SHA: e.string().optional().description("Git commit SHA"),
} satisfies EnvSchema;

// ============================================================
// Database Configuration (for backend services)
// ============================================================

export const databaseSchema = {
  DATABASE_URL: e
    .url()
    .protocols(["postgres", "postgresql"])
    .secret()
    .description("PostgreSQL connection string")
    .example("postgresql://user:pass@localhost:5432/mydb"),

  DATABASE_POOL_MIN: e
    .number()
    .integer()
    .min(0)
    .default(2)
    .description("Minimum database connections"),

  DATABASE_POOL_MAX: e
    .number()
    .integer()
    .min(1)
    .default(10)
    .description("Maximum database connections"),

  DATABASE_SSL: e
    .boolean()
    .default(false)
    .description("Enable SSL for database connection"),
} satisfies EnvSchema;

// ============================================================
// Redis Configuration (for caching services)
// ============================================================

export const redisSchema = {
  REDIS_URL: e
    .url()
    .protocols(["redis", "rediss"])
    .optional()
    .description("Redis connection URL")
    .example("redis://localhost:6379"),

  REDIS_TTL: e
    .duration()
    .default("1h")
    .description("Default cache TTL in milliseconds (env accepts: 1h, 30m, etc)"),
} satisfies EnvSchema;

// ============================================================
// API Configuration (for API services)
// ============================================================

export const apiSchema = {
  API_PORT: e
    .number()
    .port()
    .default(3000)
    .description("API server port"),

  API_HOST: e.string().default("0.0.0.0").description("API server host"),

  API_CORS_ORIGIN: e
    .array(e.string())
    .optional()
    .description("Allowed CORS origins (comma-separated URLs)"),

  API_RATE_LIMIT: e
    .number()
    .integer()
    .positive()
    .default(100)
    .description("Requests per minute per IP"),

  JWT_SECRET: e
    .string()
    .minLength(32)
    .secret()
    .description("JWT signing secret"),

  JWT_EXPIRY: e.duration().default("24h").description("JWT token expiry"),
} satisfies EnvSchema;

// ============================================================
// Worker Configuration (for background job processors)
// ============================================================

export const workerSchema = {
  WORKER_CONCURRENCY: e
    .number()
    .integer()
    .min(1)
    .max(100)
    .default(5)
    .description("Number of concurrent jobs"),

  WORKER_TIMEOUT: e.duration().default("5m").description("Job execution timeout"),

  QUEUE_NAME: e.string().default("default").description("Queue name to process"),
} satisfies EnvSchema;

// ============================================================
// Package-Specific Configurations
// ============================================================

/**
 * Example: API Service Environment
 * packages/api/src/env.ts
 */
export const apiEnv = createEnv({
  ...baseSchema,
  ...databaseSchema,
  ...redisSchema,
  ...apiSchema,
});

/**
 * Example: Worker Service Environment
 * packages/worker/src/env.ts
 */
export const workerEnv = createEnv({
  ...baseSchema,
  ...databaseSchema,
  ...redisSchema,
  ...workerSchema,
});

/**
 * Example: Frontend Environment (Public Variables Only)
 * apps/web/src/env.ts
 */
export const webEnv = createEnv(
  {
    ...baseSchema,
    API_URL: e
      .url()
      .http()
      .description("Backend API URL")
      .example("https://api.example.com"),

    ENABLE_DEV_TOOLS: e.boolean().default(false),
  },
  {
    // Only read variables with this prefix
    prefix: "NEXT_PUBLIC_",
    stripPrefix: true,
  }
);

// ============================================================
// Type Exports
// ============================================================

export type BaseEnv = InferEnv<typeof baseSchema>;
export type ApiEnv = typeof apiEnv;
export type WorkerEnv = typeof workerEnv;
export type WebEnv = typeof webEnv;

// ============================================================
// Usage Examples
// ============================================================

console.log("📦 Monorepo Environment Configuration");
console.log("");
console.log("=== API Service ===");
console.log("Port:", apiEnv.API_PORT);
console.log("Database:", apiEnv.DATABASE_URL.hostname);
console.log("Redis:", apiEnv.REDIS_URL?.hostname ?? "not configured");
console.log("CORS Origins:", apiEnv.API_CORS_ORIGIN ?? ["*"]);
console.log("");

console.log("=== Worker Service ===");
console.log("Concurrency:", workerEnv.WORKER_CONCURRENCY);
console.log("Queue:", workerEnv.QUEUE_NAME);
console.log("Timeout:", workerEnv.WORKER_TIMEOUT, "ms");
console.log("");

console.log("=== Web Frontend ===");
console.log("API URL:", webEnv.API_URL.toString());
console.log("Dev Tools:", webEnv.ENABLE_DEV_TOOLS ? "enabled" : "disabled");
console.log("Analytics:", webEnv.ENABLE_ANALYTICS ? "enabled" : "disabled");

/**
 * Directory Structure:
 *
 * monorepo/
 * ├── packages/
 * │   ├── config/           # Shared configuration
 * │   │   ├── env.ts        # This file - shared schemas
 * │   │   └── package.json
 * │   │
 * │   ├── api/              # API service
 * │   │   ├── src/
 * │   │   │   ├── env.ts    # import { baseSchema, apiSchema } from '@repo/config/env'
 * │   │   │   └── index.ts
 * │   │   └── package.json
 * │   │
 * │   └── worker/           # Background worker
 * │       ├── src/
 * │       │   ├── env.ts    # import { baseSchema, workerSchema } from '@repo/config/env'
 * │       │   └── index.ts
 * │       └── package.json
 * │
 * ├── apps/
 * │   └── web/              # Frontend app
 * │       ├── src/
 * │       │   ├── env.ts    # import { baseSchema } from '@repo/config/env'
 * │       │   └── app.tsx
 * │       └── package.json
 * │
 * ├── pnpm-workspace.yaml
 * └── package.json
 */

/**
 * Example pnpm-workspace.yaml:
 *
 * packages:
 *   - 'packages/*'
 *   - 'apps/*'
 */

/**
 * Example package.json in packages/api:
 *
 * {
 *   "name": "@repo/api",
 *   "dependencies": {
 *     "@repo/config": "workspace:*",
 *     "envproof": "^1.1.0"
 *   }
 * }
 */

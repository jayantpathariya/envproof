/**
 * Example: Express.js Application
 *
 * This example shows how to use EnvProof with Express.js
 */

import { createEnv, e } from "../src/index.js";

// Define environment schema for an Express app
export const env = createEnv({
  // Server configuration
  PORT: e.number().port().default(3000).description("HTTP server port"),

  HOST: e.string().default("0.0.0.0").description("Server host binding"),

  NODE_ENV: e
    .enum(["development", "staging", "production"] as const)
    .default("development")
    .description("Application environment"),

  // Database
  DATABASE_URL: e
    .url()
    .protocols(["postgresql", "postgres"])
    .description("PostgreSQL connection string")
    .example("postgresql://user:pass@localhost:5432/mydb"),

  // Redis (optional)
  REDIS_URL: e
    .url()
    .protocols(["redis", "rediss"])
    .optional()
    .description("Redis connection string"),

  // Security
  JWT_SECRET: e
    .string()
    .minLength(32)
    .secret()
    .description("JWT signing secret (min 32 chars)"),

  CORS_ORIGINS: e
    .json<string[]>()
    .array()
    .default(["http://localhost:3000"])
    .description("Allowed CORS origins"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: e
    .number()
    .positive()
    .default(60000)
    .description("Rate limit window in milliseconds"),

  RATE_LIMIT_MAX_REQUESTS: e
    .number()
    .positive()
    .default(100)
    .description("Maximum requests per window"),

  // Logging
  LOG_LEVEL: e
    .enum(["debug", "info", "warn", "error"] as const)
    .default("info")
    .description("Logging verbosity"),

  LOG_FORMAT: e
    .enum(["json", "pretty"] as const)
    .default("json")
    .description("Log output format"),
});

// Usage in Express app:
/*
import express from 'express';
import { env } from './env';

const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
  });
});

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server running at http://${env.HOST}:${env.PORT}`);
});
*/

console.log("Express environment configuration:");
console.log("  PORT:", env.PORT);
console.log("  HOST:", env.HOST);
console.log("  NODE_ENV:", env.NODE_ENV);
console.log("  LOG_LEVEL:", env.LOG_LEVEL);

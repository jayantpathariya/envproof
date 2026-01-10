/**
 * Example: Basic Usage
 *
 * This example demonstrates the basic usage of EnvKit
 * for validating environment variables.
 */

import { createEnv, e } from "../src/index.js";

// Define your environment schema
// This is the single source of truth for:
// - Runtime validation
// - Type inference
// - Error messages
// - .env.example generation
const env = createEnv({
  // Required URL - must be set and valid
  DATABASE_URL: e
    .url()
    .description("PostgreSQL connection string")
    .example("postgresql://user:pass@localhost:5432/mydb"),

  // Required number with port validation, has default
  PORT: e.number().port().default(3000).description("HTTP server port"),

  // Required enum - must be one of these values
  NODE_ENV: e
    .enum(["development", "staging", "production"] as const)
    .description("Application environment"),

  // Optional boolean - can be undefined
  DEBUG: e.boolean().optional().description("Enable debug logging"),

  // Required secret - masked in error output
  API_KEY: e.string().secret().description("External API key"),

  // Optional JSON configuration
  REDIS_CONFIG: e
    .json<{ host: string; port: number }>()
    .optional()
    .description("Redis connection configuration"),
});

// TypeScript knows all the types!
console.log("Environment validated successfully!");
console.log("");
console.log("DATABASE_URL:", env.DATABASE_URL.hostname); // URL object
console.log("PORT:", env.PORT); // number
console.log("NODE_ENV:", env.NODE_ENV); // 'development' | 'staging' | 'production'
console.log("DEBUG:", env.DEBUG); // boolean | undefined
console.log("API_KEY:", env.API_KEY.slice(0, 3) + "***"); // string (masked for display)
console.log("REDIS_CONFIG:", env.REDIS_CONFIG); // { host: string; port: number } | undefined

// Export for use throughout your application
export { env };

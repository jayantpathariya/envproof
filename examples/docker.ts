/**
 * Example: Docker & Container Environments
 *
 * This example shows how to configure EnvProof for containerized applications
 */

import { createEnv, e } from "../src/index.js";

// Docker-specific environment configuration
const env = createEnv(
  {
    // Container runtime
    CONTAINER_NAME: e
      .string()
      .optional()
      .description("Name of the container instance"),

    // Health check endpoint
    HEALTH_CHECK_PORT: e
      .number()
      .port()
      .default(9090)
      .description("Port for health check endpoint"),

    // Resource limits
    MEMORY_LIMIT: e
      .string()
      .pattern(/^\d+[MGT]$/)
      .optional()
      .description("Memory limit (e.g., 512M, 2G)")
      .example("1G"),

    CPU_LIMIT: e
      .number()
      .positive()
      .optional()
      .description("CPU cores limit")
      .example("2"),

    // Database connection (with Docker service name)
    DATABASE_HOST: e
      .string()
      .default("postgres") // Docker service name
      .description("Database host (use service name in Docker Compose)"),

    DATABASE_PORT: e.number().port().default(5432),

    DATABASE_NAME: e.string().default("myapp"),

    DATABASE_USER: e.string().default("postgres"),

    DATABASE_PASSWORD: e.string().secret().description("Database password"),

    // Redis (with Docker service name)
    REDIS_HOST: e
      .string()
      .default("redis")
      .description("Redis host (use service name in Docker Compose)"),

    REDIS_PORT: e.number().port().default(6379),

    // Application
    NODE_ENV: e.enum(["development", "staging", "production"] as const),

    PORT: e.number().port().default(3000).description("Application port"),

    // Logging
    LOG_LEVEL: e
      .enum(["debug", "info", "warn", "error"] as const)
      .default("info"),

    LOG_FORMAT: e.enum(["json", "pretty"] as const).default("json"),

    // Feature flags for different environments
    ENABLE_SWAGGER: e
      .boolean()
      .default(false)
      .description("Enable Swagger documentation"),

    ENABLE_METRICS: e
      .boolean()
      .default(true)
      .description("Enable Prometheus metrics"),

    // Service mesh / orchestration
    SERVICE_NAME: e.string().default("api"),

    SERVICE_VERSION: e.string().optional().description("Semantic version"),

    NAMESPACE: e
      .string()
      .default("default")
      .description("Kubernetes namespace"),
  },
  {
    dotenv: true,
    environment: process.env.NODE_ENV,
    optionalInDevelopment: ["DATABASE_PASSWORD"], // Allow dev without password
  }
);

// Construct database URL from components
const databaseUrl = `postgresql://${env.DATABASE_USER}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`;

const redisUrl = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;

console.log("🐳 Docker Environment Configuration Loaded");
console.log("");
console.log("Service:", env.SERVICE_NAME);
console.log("Version:", env.SERVICE_VERSION ?? "unknown");
console.log("Environment:", env.NODE_ENV);
console.log("Container:", env.CONTAINER_NAME ?? "unnamed");
console.log("");
console.log("Database:", `${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}`);
console.log("Redis:", `${env.REDIS_HOST}:${env.REDIS_PORT}`);
console.log("");
console.log("Application Port:", env.PORT);
console.log("Health Check Port:", env.HEALTH_CHECK_PORT);
console.log("");
console.log("Features:");
console.log("  - Swagger:", env.ENABLE_SWAGGER ? "✅" : "❌");
console.log("  - Metrics:", env.ENABLE_METRICS ? "✅" : "❌");

export { env, databaseUrl, redisUrl };

/**
 * Example docker-compose.yml:
 *
 * version: '3.8'
 * services:
 *   api:
 *     build: .
 *     ports:
 *       - "3000:3000"
 *       - "9090:9090"
 *     environment:
 *       NODE_ENV: production
 *       DATABASE_HOST: postgres
 *       DATABASE_PASSWORD: ${DATABASE_PASSWORD}
 *       REDIS_HOST: redis
 *       SERVICE_VERSION: ${CI_COMMIT_TAG:-latest}
 *     depends_on:
 *       - postgres
 *       - redis
 *
 *   postgres:
 *     image: postgres:16-alpine
 *     environment:
 *       POSTGRES_DB: myapp
 *       POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
 *     volumes:
 *       - postgres_data:/var/lib/postgresql/data
 *
 *   redis:
 *     image: redis:7-alpine
 *     volumes:
 *       - redis_data:/data
 *
 * volumes:
 *   postgres_data:
 *   redis_data:
 */

/**
 * Example Dockerfile:
 *
 * FROM node:20-alpine AS builder
 * WORKDIR /app
 * COPY package*.json ./
 * RUN npm ci
 * COPY . .
 * RUN npm run build
 *
 * FROM node:20-alpine
 * WORKDIR /app
 * COPY --from=builder /app/dist ./dist
 * COPY --from=builder /app/node_modules ./node_modules
 * COPY package*.json ./
 *
 * ENV NODE_ENV=production
 * EXPOSE 3000 9090
 * HEALTHCHECK --interval=30s --timeout=3s \
 *   CMD wget --no-verbose --tries=1 --spider http://localhost:9090/health || exit 1
 *
 * USER node
 * CMD ["node", "dist/index.js"]
 */

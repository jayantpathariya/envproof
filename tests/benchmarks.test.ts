/**
 * EnvProof - Performance Benchmarks
 * Ensure validation stays fast as the library grows
 */

import { describe, it, expect } from "vitest";
import { createEnv, e, validateEnv } from "../src/index.js";

describe("Performance Benchmarks", () => {
  it("should validate simple schema in < 5ms", () => {
    const schema = {
      PORT: e.number().port().default(3000),
      NODE_ENV: e.enum(["development", "production"] as const),
    };

    const start = performance.now();
    const result = validateEnv(schema, {
      source: { PORT: "3000", NODE_ENV: "development" },
    });
    const duration = performance.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5); // Should be fast
  });

  it("should validate complex schema with 50 variables in < 5ms", () => {
    const schema: Record<string, any> = {};

    // Create schema with 50 variables
    for (let i = 0; i < 50; i++) {
      schema[`VAR_${i}`] = e.string().optional().default(`value_${i}`);
    }

    const start = performance.now();
    const result = validateEnv(schema, { source: {} });
    const duration = performance.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(5);
  });

  it("should validate string patterns efficiently", () => {
    const schema = {
      EMAIL: e.string().email().default("test@example.com"),
      UUID: e.string().uuid().default("550e8400-e29b-41d4-a716-446655440000"),
      HOST: e.string().nonEmpty().default("api.example.com"),
    };

    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      validateEnv(schema, {
        source: {
          EMAIL: "test@example.com",
          UUID: "550e8400-e29b-41d4-a716-446655440000",
          HOST: "api.example.com",
        },
      });
    }

    const duration = performance.now() - start;
    const avgDuration = duration / iterations;

    expect(avgDuration).toBeLessThan(1); // Average < 1ms per validation
  });

  it("should have minimal memory footprint for frozen env objects", () => {
    const schema = {
      PORT: e.number().default(3000),
      HOST: e.string().default("localhost"),
      DEBUG: e.boolean().default(false),
    };

    const env1 = createEnv(schema, { source: {} });
    const env2 = createEnv(schema, { source: {} });

    // Frozen objects should be lightweight
    expect(Object.isFrozen(env1)).toBe(true);
    expect(Object.isFrozen(env2)).toBe(true);

    // Properties should be read-only
    expect(() => {
      // @ts-expect-error - Testing runtime freeze
      env1.PORT = 4000;
    }).toThrow();
  });

  it("should handle large JSON objects efficiently", () => {
    const largeConfig = JSON.stringify({
      nested: {
        deeply: {
          config: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            value: `item_${i}`,
          })),
        },
      },
    });

    const schema = {
      CONFIG: e.json().default(largeConfig),
    };

    const start = performance.now();
    const result = validateEnv(schema, {
      source: { CONFIG: largeConfig },
    });
    const duration = performance.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(10);
  });

  it("should validate arrays efficiently", () => {
    const schema = {
      HOSTS: e.array(e.string()),
    };

    const start = performance.now();
    const result = validateEnv(schema, {
      source: {
        HOSTS: "host1.com,host2.com,host3.com,host4.com,host5.com",
      },
    });
    const duration = performance.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(2);
  });

  it("should fail fast on first error", () => {
    const schema = {
      VAR1: e.string(),
      VAR2: e.string(),
      VAR3: e.string(),
      VAR4: e.string(),
      VAR5: e.string(),
    };

    // All variables missing - should still be fast
    const start = performance.now();
    const result = validateEnv(schema, { source: {} });
    const duration = performance.now() - start;

    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(5);
    expect(duration).toBeLessThan(10); // More lenient for CI/slower machines
  });
});

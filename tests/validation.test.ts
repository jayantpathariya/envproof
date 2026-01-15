/**
 * EnvProof - Validation Tests
 * Test the validation engine
 */

import { describe, it, expect } from "vitest";
import { e, validateEnv, EnvValidationError } from "../src/index.js";
import { validate } from "../src/validation/engine.js";

describe("validate", () => {
  it("validates required string", () => {
    const schema = {
      API_KEY: e.string(),
    };

    const result = validate(schema, { API_KEY: "secret123" });

    expect(result.success).toBe(true);
    expect(result.data?.API_KEY).toBe("secret123");
  });

  it("fails on missing required variable", () => {
    const schema = {
      API_KEY: e.string(),
    };

    const result = validate(schema, {});

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.reason).toBe("missing");
    expect(result.errors[0]?.variable).toBe("API_KEY");
  });

  it("fails on empty required variable", () => {
    const schema = {
      API_KEY: e.string(),
    };

    const result = validate(schema, { API_KEY: "" });

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.reason).toBe("empty");
  });

  it("allows missing optional variable", () => {
    const schema = {
      DEBUG: e.boolean().optional(),
    };

    const result = validate(schema, {});

    expect(result.success).toBe(true);
    expect(result.data?.DEBUG).toBeUndefined();
  });

  it("uses default value for missing variable", () => {
    const schema = {
      PORT: e.number().default(3000),
    };

    const result = validate(schema, {});

    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(3000);
  });

  it("validates number coercion", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(schema, { PORT: "8080" });

    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(8080);
  });

  it("fails on invalid number", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(schema, { PORT: "not-a-number" });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.reason).toBe("invalid_type");
  });

  it("validates boolean coercion", () => {
    const schema = {
      DEBUG: e.boolean(),
    };

    const result = validate(schema, { DEBUG: "true" });

    expect(result.success).toBe(true);
    expect(result.data?.DEBUG).toBe(true);
  });

  it("validates enum values", () => {
    const schema = {
      NODE_ENV: e.enum(["development", "production"] as const),
    };

    const result = validate(schema, { NODE_ENV: "development" });

    expect(result.success).toBe(true);
    expect(result.data?.NODE_ENV).toBe("development");
  });

  it("fails on invalid enum value", () => {
    const schema = {
      NODE_ENV: e.enum(["development", "production"] as const),
    };

    const result = validate(schema, { NODE_ENV: "staging" });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.reason).toBe("invalid_type");
  });

  it("validates URL", () => {
    const schema = {
      DATABASE_URL: e.url(),
    };

    const result = validate(schema, {
      DATABASE_URL: "postgresql://localhost:5432/db",
    });

    expect(result.success).toBe(true);
    expect(result.data?.DATABASE_URL).toBeInstanceOf(URL);
    expect(result.data?.DATABASE_URL.hostname).toBe("localhost");
  });

  it("validates JSON", () => {
    const schema = {
      CONFIG: e.json<{ debug: boolean }>(),
    };

    const result = validate(schema, { CONFIG: '{"debug":true}' });

    expect(result.success).toBe(true);
    expect(result.data?.CONFIG).toEqual({ debug: true });
  });

  it("collects all errors", () => {
    const schema = {
      API_KEY: e.string(),
      PORT: e.number(),
      DEBUG: e.boolean(),
    };

    const result = validate(schema, {});

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it("validates custom rules", () => {
    const schema = {
      PASSWORD: e.string().minLength(8),
    };

    const result = validate(schema, { PASSWORD: "short" });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.reason).toBe("invalid_value");
  });

  it("applies prefix to variable names", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(schema, { APP_PORT: "3000" }, { prefix: "APP_" });

    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(3000);
  });

  it("strips prefix in error variable names", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(
      schema,
      { APP_PORT: "not-a-number" },
      { prefix: "APP_", stripPrefix: true }
    );

    expect(result.success).toBe(false);
    expect(result.errors[0]?.variable).toBe("PORT");
  });

  it("keeps full env key when stripPrefix is false", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(
      schema,
      { APP_PORT: "not-a-number" },
      { prefix: "APP_", stripPrefix: false }
    );

    expect(result.success).toBe(false);
    expect(result.errors[0]?.variable).toBe("APP_PORT");
  });

  it("returns invalid_type for invalid JSON", () => {
    const schema = {
      CONFIG: e.json(),
    };

    const result = validate(schema, { CONFIG: "{invalid}" });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.reason).toBe("invalid_type");
  });

  it("masks secret values in errors", () => {
    const schema = {
      API_KEY: e.string().secret(),
    };

    const result = validate(schema, { API_KEY: "invalid" });
    // Force a validation rule failure to check masking
    const schemaWithRule = {
      API_KEY: e.string().secret().minLength(100),
    };

    const resultWithRule = validate(schemaWithRule, {
      API_KEY: "short-secret",
    });

    expect(resultWithRule.success).toBe(false);
    expect(resultWithRule.errors[0]?.received).toBe("[REDACTED]");
  });
});

describe("validateEnv", () => {
  it("returns result object", () => {
    const schema = {
      PORT: e.number().default(3000),
    };

    const result = validateEnv(schema, { source: {} });

    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(3000);
  });

  it("respects custom source", () => {
    const schema = {
      NODE_ENV: e.enum(["development", "production"] as const),
    };

    const result = validateEnv(schema, { source: { NODE_ENV: "production" } });

    expect(result.success).toBe(true);
    expect(result.data?.NODE_ENV).toBe("production");
  });
});

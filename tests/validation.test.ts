/**
 * EnvProof - Validation Tests
 * Test the validation engine
 */

import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { e, validateEnv, EnvValidationError, createEnv } from "../src/index.js";
import { validate, formatErrors } from "../src/validation/engine.js";

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

    const result = validate(
      schema,
      { APP_PORT: "3000" },
      { prefix: "APP_", stripPrefix: false }
    );

    expect(result.success).toBe(true);
    // When stripPrefix is false, the key remains prefixed in the data
    if (result.success && result.data) {
      expect((result.data as Record<string, unknown>).APP_PORT).toBe(3000);
    }
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

  it("fails on unknown variables in strict mode", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(
      schema,
      { PORT: "3000", EXTRA_FLAG: "1" },
      { strict: true }
    );

    expect(result.success).toBe(false);
    expect(result.errors.some((error) => error.reason === "unknown")).toBe(true);
  });

  it("ignores unknown variables listed in strictIgnore", () => {
    const schema = {
      PORT: e.number(),
    };

    const result = validate(
      schema,
      { PORT: "3000", EXTRA_FLAG: "1" },
      { strict: true, strictIgnore: ["EXTRA_FLAG"] }
    );

    expect(result.success).toBe(true);
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

  it("handles transform chaining", () => {
    const schema = {
      NAME: e
        .string()
        .transform((s) => s.toLowerCase())
        .transform((s) => s.trim()),
    };

    const result = validateEnv(schema, { source: { NAME: "  JOHN DOE  " } });

    expect(result.success).toBe(true);
    expect(result.data?.NAME).toBe("john doe");
  });

  it("handles transform errors gracefully", () => {
    const schema = {
      VALUE: e.string().transform((s) => {
        if (s === "error") throw new Error("Transform error");
        return s;
      }),
    };

    // Should not crash the validation process
    expect(() => {
      validateEnv(schema, { source: { VALUE: "error" } });
    }).toThrow();
  });

  it("uses onError: exit option", () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("Process exit called");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const schema = {
      REQUIRED: e.string(),
    };

    expect(() => {
      createEnv(schema, { source: {}, onError: "exit", exitCode: 42 });
    }).toThrow("Process exit called");

    expect(exitSpy).toHaveBeenCalledWith(42);
    expect(consoleSpy).toHaveBeenCalled();

    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("uses onError: return option", () => {
    const schema = {
      REQUIRED: e.string(),
    };

    const result = createEnv(schema, { source: {}, onError: "return" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.variable).toBe("REQUIRED");
    }
  });

  it("returns success result when onError: return and validation passes", () => {
    const schema = {
      PORT: e.number().default(3000),
    };

    const result = createEnv(schema, { source: {}, onError: "return" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
    }
  });

  it("uses onError: throw option (default)", () => {
    const schema = {
      REQUIRED: e.string(),
    };

    expect(() => {
      createEnv(schema, { source: {}, onError: "throw" });
    }).toThrow(EnvValidationError);
  });

  it("uses custom reporter function", () => {
    const customReporter = vi.fn((errors) => {
      return `Custom: ${errors.length} errors`;
    });

    const schema = {
      REQUIRED: e.string(),
    };

    const result = validateEnv(schema, { source: {} });

    if (!result.success) {
      const output = formatErrors(result.errors, customReporter);
      expect(output).toBe("Custom: 1 errors");
      expect(customReporter).toHaveBeenCalledWith(result.errors);
    }
  });

  it("uses json reporter", () => {
    const schema = {
      REQUIRED: e.string(),
    };

    const result = validateEnv(schema, { source: {} });

    if (!result.success) {
      const output = formatErrors(result.errors, "json");
      const parsed = JSON.parse(output);
      expect(parsed.success).toBe(false);
      expect(parsed.errorCount).toBe(1);
    }
  });

  it("uses minimal reporter", () => {
    const schema = {
      REQUIRED: e.string(),
    };

    const result = validateEnv(schema, { source: {} });

    if (!result.success) {
      const output = formatErrors(result.errors, "minimal");
      expect(output).toContain("REQUIRED");
    }
  });

  it("uses pretty reporter (default)", () => {
    const schema = {
      REQUIRED: e.string(),
    };

    const result = validateEnv(schema, { source: {} });

    if (!result.success) {
      const output = formatErrors(result.errors, "pretty");
      expect(output).toContain("Environment Validation Failed");
      expect(output).toContain("REQUIRED");
    }
  });

  it("handles multiple transforms", () => {
    const schema = {
      TEXT: e
        .string()
        .transform((s) => s.toUpperCase())
        .transform((s) => s.replace(/\s+/g, "_"))
        .transform((s) => s.slice(0, 10)),
    };

    const result = validateEnv(schema, {
      source: { TEXT: "hello world test" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.TEXT).toBe("HELLO_WORL");
  });

  it("validates with custom validator returning object", () => {
    const schema = {
      CODE: e.string().custom((value) => {
        if (value.length !== 6) {
          return { valid: false, message: "Code must be 6 characters" };
        }
        return { valid: true };
      }),
    };

    const result = validateEnv(schema, { source: { CODE: "12345" } });

    expect(result.success).toBe(false);
    expect(result.errors[0]?.reason).toBe("invalid_value");
  });

  it("validates with custom validator returning boolean", () => {
    const schema = {
      CODE: e.string().custom((value) => value.length === 6),
    };

    const invalidResult = validateEnv(schema, { source: { CODE: "123" } });
    expect(invalidResult.success).toBe(false);

    const validResult = validateEnv(schema, { source: { CODE: "123456" } });
    expect(validResult.success).toBe(true);
  });

  it("handles prefix with stripPrefix", () => {
    const schema = {
      PORT: e.number().default(3000),
      HOST: e.string().default("localhost"),
    };

    const result = validateEnv(schema, {
      source: { APP_PORT: "8080", APP_HOST: "0.0.0.0" },
      prefix: "APP_",
      stripPrefix: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(8080);
    expect(result.data?.HOST).toBe("0.0.0.0");
  });

  it("handles prefix without stripPrefix", () => {
    const schema = {
      PORT: e.number().default(3000),
    };

    const result = validateEnv(schema, {
      source: { APP_PORT: "8080" },
      prefix: "APP_",
      stripPrefix: false,
    });

    expect(result.success).toBe(true);
    // Should keep the prefixed key
    expect(result.data).toHaveProperty("APP_PORT");
  });

  it("loads layered dotenv files using environment", () => {
    const schema = {
      HOST: e.string(),
      PORT: e.number(),
    };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envproof-dotenv-"));
    const originalCwd = process.cwd();

    fs.writeFileSync(path.join(tempDir, ".env"), "HOST=localhost\nPORT=3000\n");
    fs.writeFileSync(path.join(tempDir, ".env.production"), "PORT=8080\n");

    try {
      process.chdir(tempDir);
      const result = validateEnv(schema, {
        dotenv: true,
        environment: "production",
      });

      expect(result.success).toBe(true);
      expect(result.data?.HOST).toBe("localhost");
      expect(result.data?.PORT).toBe(8080);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("expands dotenv variables when dotenvExpand is enabled", () => {
    const schema = {
      HOST: e.string(),
      API_URL: e.string(),
    };
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envproof-dotenv-"));
    const originalCwd = process.cwd();

    fs.writeFileSync(
      path.join(tempDir, ".env"),
      "HOST=api.example.com\nAPI_URL=https://${HOST}/v1\n"
    );

    try {
      process.chdir(tempDir);
      const result = validateEnv(schema, {
        dotenv: true,
        dotenvExpand: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.API_URL).toBe("https://api.example.com/v1");
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

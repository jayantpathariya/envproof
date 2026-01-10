/**
 * EnvKit - Reporter Tests
 * Test error formatting
 */

import { describe, it, expect } from "vitest";
import {
  formatPretty,
  formatJson,
  formatMinimal,
} from "../src/reporters/index.js";
import type { ValidationError } from "../src/types.js";

const sampleErrors: ValidationError[] = [
  {
    variable: "DATABASE_URL",
    reason: "missing",
    message: "Required variable is not set",
    expected: "URL",
    example: "postgresql://localhost:5432/db",
    isSecret: false,
  },
  {
    variable: "API_KEY",
    reason: "missing",
    message: "Required variable is not set",
    expected: "string",
    example: "your_api_key_here",
    isSecret: true,
  },
  {
    variable: "PORT",
    reason: "invalid_type",
    message: 'Cannot convert "abc" to number',
    expected: "number (integer, 1-65535)",
    received: "abc",
    example: "3000",
    isSecret: false,
  },
];

describe("formatPretty", () => {
  it("formats errors for terminal", () => {
    const output = formatPretty(sampleErrors);

    // Should have header
    expect(output).toContain("Environment Validation Failed");
    expect(output).toContain("3 errors found");

    // Should group errors
    expect(output).toContain("MISSING VARIABLES");
    expect(output).toContain("INVALID VALUES");

    // Should show variable names
    expect(output).toContain("DATABASE_URL");
    expect(output).toContain("API_KEY");
    expect(output).toContain("PORT");
  });

  it("masks secret examples", () => {
    const output = formatPretty(sampleErrors);
    // The example for API_KEY should be masked
    expect(output).toContain("API_KEY");
  });

  it("shows received values", () => {
    const output = formatPretty(sampleErrors);
    expect(output).toContain("abc");
  });
});

describe("formatJson", () => {
  it("outputs valid JSON", () => {
    const output = formatJson(sampleErrors);
    const parsed = JSON.parse(output);

    expect(parsed.success).toBe(false);
    expect(parsed.errorCount).toBe(3);
    expect(parsed.errors).toHaveLength(3);
  });

  it("includes all error properties", () => {
    const output = formatJson(sampleErrors);
    const parsed = JSON.parse(output);

    const firstError = parsed.errors[0];
    expect(firstError.variable).toBe("DATABASE_URL");
    expect(firstError.reason).toBe("missing");
    expect(firstError.expected).toBe("URL");
  });

  it("includes received when present", () => {
    const output = formatJson(sampleErrors);
    const parsed = JSON.parse(output);

    const portError = parsed.errors.find(
      (e: ValidationError) => e.variable === "PORT"
    );
    expect(portError.received).toBe("abc");
  });
});

describe("formatMinimal", () => {
  it("outputs single line", () => {
    const output = formatMinimal(sampleErrors);

    expect(output.split("\n")).toHaveLength(1);
    expect(output).toContain("EnvKit:");
    expect(output).toContain("3 invalid environment variables");
  });

  it("lists variable names", () => {
    const output = formatMinimal(sampleErrors);

    expect(output).toContain("DATABASE_URL");
    expect(output).toContain("API_KEY");
    expect(output).toContain("PORT");
  });

  it("handles single error", () => {
    const output = formatMinimal([sampleErrors[0]!]);

    expect(output).toContain("1 invalid environment variable");
    expect(output).not.toContain("variables"); // Should be singular
  });
});

/**
 * EnvProof - Schema Tests
 * Test schema builders and their validation
 */

import { describe, it, expect } from "vitest";
import { e } from "../src/index.js";

describe("StringSchema", () => {
  it("creates a basic string schema", () => {
    const schema = e.string();
    expect(schema._def.type).toBe("string");
    expect(schema._def.isOptional).toBe(false);
  });

  it("marks as optional", () => {
    const schema = e.string().optional();
    expect(schema._def.isOptional).toBe(true);
  });

  it("sets default value", () => {
    const schema = e.string().default("fallback");
    expect(schema._def.defaultValue).toBe("fallback");
    expect(schema._def.isOptional).toBe(false);
  });

  it("marks as secret", () => {
    const schema = e.string().secret();
    expect(schema._def.metadata.isSecret).toBe(true);
  });

  it("adds description", () => {
    const schema = e.string().description("A test variable");
    expect(schema._def.metadata.description).toBe("A test variable");
  });

  it("validates minimum length", () => {
    const schema = e.string().minLength(5);
    const result = schema._def.coerce("hello");
    expect(result.success).toBe(true);

    const isValid = schema._def.rules[0]?.validate("hi");
    expect(isValid).toBe(false);
  });

  it("validates pattern", () => {
    const schema = e.string().pattern(/^[A-Z]+$/);

    const passesRule = schema._def.rules[0]?.validate("HELLO");
    expect(passesRule).toBe(true);

    const failsRule = schema._def.rules[0]?.validate("hello");
    expect(failsRule).toBe(false);
  });
});

describe("NumberSchema", () => {
  it("coerces string to number", () => {
    const schema = e.number();
    const result = schema._def.coerce("42");
    expect(result).toEqual({ success: true, value: 42 });
  });

  it("coerces float", () => {
    const schema = e.number();
    const result = schema._def.coerce("3.14");
    expect(result).toEqual({ success: true, value: 3.14 });
  });

  it("fails on invalid number", () => {
    const schema = e.number();
    const result = schema._def.coerce("not-a-number");
    expect(result.success).toBe(false);
  });

  it("validates integer", () => {
    const schema = e.number().integer();
    const rule = schema._def.rules.find((r) => r.name === "integer");

    expect(rule?.validate(42)).toBe(true);
    expect(rule?.validate(3.14)).toBe(false);
  });

  it("validates min/max", () => {
    const schema = e.number().min(0).max(100);
    const minRule = schema._def.rules.find((r) => r.name === "min");
    const maxRule = schema._def.rules.find((r) => r.name === "max");

    expect(minRule?.validate(50)).toBe(true);
    expect(minRule?.validate(-1)).toBe(false);
    expect(maxRule?.validate(100)).toBe(true);
    expect(maxRule?.validate(101)).toBe(false);
  });

  it("validates port", () => {
    const schema = e.number().port();
    expect(schema._def.rules.length).toBe(3); // integer, min, max
    expect(schema.getTypeDescription()).toContain("integer");
  });
});

describe("BooleanSchema", () => {
  it("coerces true values", () => {
    const schema = e.boolean();

    expect(schema._def.coerce("true")).toEqual({ success: true, value: true });
    expect(schema._def.coerce("1")).toEqual({ success: true, value: true });
    expect(schema._def.coerce("yes")).toEqual({ success: true, value: true });
    expect(schema._def.coerce("on")).toEqual({ success: true, value: true });
  });

  it("coerces false values", () => {
    const schema = e.boolean();

    expect(schema._def.coerce("false")).toEqual({
      success: true,
      value: false,
    });
    expect(schema._def.coerce("0")).toEqual({ success: true, value: false });
    expect(schema._def.coerce("no")).toEqual({ success: true, value: false });
    expect(schema._def.coerce("off")).toEqual({ success: true, value: false });
  });

  it("is case insensitive", () => {
    const schema = e.boolean();

    expect(schema._def.coerce("TRUE")).toEqual({ success: true, value: true });
    expect(schema._def.coerce("False")).toEqual({
      success: true,
      value: false,
    });
  });

  it("fails on invalid values", () => {
    const schema = e.boolean();
    const result = schema._def.coerce("maybe");
    expect(result.success).toBe(false);
  });
});

describe("EnumSchema", () => {
  it("validates enum values", () => {
    const schema = e.enum(["dev", "staging", "prod"] as const);

    expect(schema._def.coerce("dev")).toEqual({ success: true, value: "dev" });
    expect(schema._def.coerce("staging")).toEqual({
      success: true,
      value: "staging",
    });
    expect(schema._def.coerce("prod")).toEqual({
      success: true,
      value: "prod",
    });
  });

  it("fails on invalid values", () => {
    const schema = e.enum(["dev", "staging", "prod"] as const);
    const result = schema._def.coerce("invalid");
    expect(result.success).toBe(false);
  });

  it("provides good type description", () => {
    const schema = e.enum(["a", "b", "c"] as const);
    expect(schema.getTypeDescription()).toBe("enum (a | b | c)");
  });
});

describe("UrlSchema", () => {
  it("parses valid URL", () => {
    const schema = e.url();
    const result = schema._def.coerce("https://example.com");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBeInstanceOf(URL);
      expect(result.value.hostname).toBe("example.com");
    }
  });

  it("fails on invalid URL", () => {
    const schema = e.url();
    const result = schema._def.coerce("not-a-url");
    expect(result.success).toBe(false);
  });

  it("validates protocols", () => {
    const schema = e.url().protocols(["https"]);
    const result = schema._def.coerce("https://example.com");

    expect(result.success).toBe(true);
    if (result.success) {
      const rule = schema._def.rules[0];
      expect(rule?.validate(result.value)).toBe(true);

      const httpUrl = new URL("http://example.com");
      expect(rule?.validate(httpUrl)).toBe(false);
    }
  });
});

describe("JsonSchema", () => {
  it("parses valid JSON object", () => {
    const schema = e.json<{ name: string }>();
    const result = schema._def.coerce('{"name":"test"}');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual({ name: "test" });
    }
  });

  it("parses valid JSON array", () => {
    const schema = e.json<string[]>();
    const result = schema._def.coerce('["a","b","c"]');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(["a", "b", "c"]);
    }
  });

  it("fails on invalid JSON", () => {
    const schema = e.json();
    const result = schema._def.coerce("{invalid}");
    expect(result.success).toBe(false);
  });

  it("validates array type", () => {
    const schema = e.json().array();
    const rule = schema._def.rules[0];

    expect(rule?.validate(["a", "b"])).toBe(true);
    expect(rule?.validate({ key: "value" })).toBe(false);
  });

  it("validates object type", () => {
    const schema = e.json().object();
    const rule = schema._def.rules[0];

    expect(rule?.validate({ key: "value" })).toBe(true);
    expect(rule?.validate(["a", "b"])).toBe(false);
    expect(rule?.validate(null)).toBe(false);
  });
});

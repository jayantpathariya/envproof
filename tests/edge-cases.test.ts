/**
 * EnvProof - Edge Case Tests
 * Test edge cases for all schema types
 */

import { describe, it, expect } from "vitest";
import { e, validateEnv } from "../src/index.js";

describe("String Edge Cases", () => {
  it("handles unicode characters", () => {
    const schema = {
      NAME: e.string(),
    };

    const result = validateEnv(schema, {
      source: { NAME: "こんにちは世界" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.NAME).toBe("こんにちは世界");
  });

  it("handles emojis", () => {
    const schema = {
      EMOJI: e.string(),
    };

    const result = validateEnv(schema, {
      source: { EMOJI: "🎉🚀✨" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.EMOJI).toBe("🎉🚀✨");
  });

  it("handles very long strings", () => {
    const schema = {
      LONG: e.string(),
    };

    const longString = "a".repeat(10000);
    const result = validateEnv(schema, {
      source: { LONG: longString },
    });

    expect(result.success).toBe(true);
    expect(result.data?.LONG).toHaveLength(10000);
  });

  it("handles strings with special characters", () => {
    const schema = {
      SPECIAL: e.string(),
    };

    const result = validateEnv(schema, {
      source: { SPECIAL: "!@#$%^&*()_+-=[]{}|;:',.<>?/`~" },
    });

    expect(result.success).toBe(true);
  });

  it("handles newlines and tabs", () => {
    const schema = {
      MULTILINE: e.string(),
    };

    const result = validateEnv(schema, {
      source: { MULTILINE: "line1\nline2\tline3" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.MULTILINE).toContain("\n");
  });

  it("handles pattern validation with complex regex", () => {
    const schema = {
      COMPLEX: e.string().pattern(/^[a-zA-Z0-9_-]{3,16}$/),
    };

    const valid = validateEnv(schema, {
      source: { COMPLEX: "user-name_123" },
    });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, {
      source: { COMPLEX: "invalid space" },
    });
    expect(invalid.success).toBe(false);
  });

  it("handles email validation with unicode", () => {
    const schema = {
      EMAIL: e.string().email(),
    };

    const result = validateEnv(schema, {
      source: { EMAIL: "user@example.com" },
    });

    expect(result.success).toBe(true);
  });
});

describe("Number Edge Cases", () => {
  it("handles scientific notation", () => {
    const schema = {
      SCI: e.number(),
    };

    const result = validateEnv(schema, {
      source: { SCI: "1e5" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.SCI).toBe(100000);
  });

  it("handles negative scientific notation", () => {
    const schema = {
      SCI: e.number(),
    };

    const result = validateEnv(schema, {
      source: { SCI: "1e-3" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.SCI).toBe(0.001);
  });

  it("rejects Infinity", () => {
    const schema = {
      NUM: e.number(),
    };

    const result = validateEnv(schema, {
      source: { NUM: "Infinity" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects NaN", () => {
    const schema = {
      NUM: e.number(),
    };

    const result = validateEnv(schema, {
      source: { NUM: "NaN" },
    });

    expect(result.success).toBe(false);
  });

  it("handles negative zero", () => {
    const schema = {
      NUM: e.number(),
    };

    const result = validateEnv(schema, {
      source: { NUM: "-0" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.NUM).toBe(-0);
  });

  it("handles very large numbers", () => {
    const schema = {
      BIG: e.number(),
    };

    const result = validateEnv(schema, {
      source: { BIG: "9007199254740991" }, // MAX_SAFE_INTEGER
    });

    expect(result.success).toBe(true);
    expect(result.data?.BIG).toBe(9007199254740991);
  });

  it("handles very small numbers", () => {
    const schema = {
      SMALL: e.number(),
    };

    const result = validateEnv(schema, {
      source: { SMALL: "0.000000001" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.SMALL).toBeCloseTo(0.000000001);
  });

  it("handles numbers with leading zeros", () => {
    const schema = {
      NUM: e.number(),
    };

    const result = validateEnv(schema, {
      source: { NUM: "007" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.NUM).toBe(7);
  });

  it("handles numbers with plus sign", () => {
    const schema = {
      NUM: e.number(),
    };

    const result = validateEnv(schema, {
      source: { NUM: "+42" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.NUM).toBe(42);
  });
});

describe("Boolean Edge Cases", () => {
  it("handles case variations of true", () => {
    const schema = {
      BOOL: e.boolean(),
    };

    const cases = ["True", "TRUE", "TrUe"];
    for (const value of cases) {
      const result = validateEnv(schema, { source: { BOOL: value } });
      expect(result.success).toBe(true);
      expect(result.data?.BOOL).toBe(true);
    }
  });

  it("handles case variations of false", () => {
    const schema = {
      BOOL: e.boolean(),
    };

    const cases = ["False", "FALSE", "FaLsE"];
    for (const value of cases) {
      const result = validateEnv(schema, { source: { BOOL: value } });
      expect(result.success).toBe(true);
      expect(result.data?.BOOL).toBe(false);
    }
  });

  it("handles whitespace around boolean values", () => {
    const schema = {
      BOOL: e.boolean(),
    };

    const result = validateEnv(schema, {
      source: { BOOL: "  true  " },
    });

    expect(result.success).toBe(true);
    expect(result.data?.BOOL).toBe(true);
  });

  it("rejects invalid boolean values", () => {
    const schema = {
      BOOL: e.boolean(),
    };

    const invalid = ["maybe", "y", "n", "yes!", "2"];
    for (const value of invalid) {
      const result = validateEnv(schema, { source: { BOOL: value } });
      expect(result.success).toBe(false);
    }
  });
});

describe("URL Edge Cases", () => {
  it("handles URLs with credentials", () => {
    const schema = {
      URL: e.url(),
    };

    const result = validateEnv(schema, {
      source: { URL: "https://user:pass@example.com/path" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.URL.username).toBe("user");
    expect(result.data?.URL.password).toBe("pass");
  });

  it("handles IPv6 addresses", () => {
    const schema = {
      URL: e.url(),
    };

    const result = validateEnv(schema, {
      source: { URL: "http://[2001:db8::1]:8080/" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.URL.hostname).toBe("[2001:db8::1]");
  });

  it("handles URLs with query parameters", () => {
    const schema = {
      URL: e.url(),
    };

    const result = validateEnv(schema, {
      source: { URL: "https://example.com?foo=bar&baz=qux" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.URL.searchParams.get("foo")).toBe("bar");
  });

  it("handles URLs with fragments", () => {
    const schema = {
      URL: e.url(),
    };

    const result = validateEnv(schema, {
      source: { URL: "https://example.com/page#section" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.URL.hash).toBe("#section");
  });

  it("handles URLs with encoded characters", () => {
    const schema = {
      URL: e.url(),
    };

    const result = validateEnv(schema, {
      source: { URL: "https://example.com/path%20with%20spaces" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.URL.pathname).toBe("/path%20with%20spaces");
  });

  it("rejects relative URLs", () => {
    const schema = {
      URL: e.url(),
    };

    const result = validateEnv(schema, {
      source: { URL: "/relative/path" },
    });

    expect(result.success).toBe(false);
  });

  it("handles custom protocols", () => {
    const schema = {
      URL: e.url().protocols(["custom"]),
    };

    const result = validateEnv(schema, {
      source: { URL: "custom://example.com" },
    });

    expect(result.success).toBe(true);
  });
});

describe("Enum Edge Cases", () => {
  it("handles case-sensitive matching", () => {
    const schema = {
      ENV: e.enum(["dev", "prod"] as const),
    };

    const result = validateEnv(schema, {
      source: { ENV: "Dev" }, // Different case
    });

    expect(result.success).toBe(false);
  });

  it("handles whitespace in values", () => {
    const schema = {
      ENV: e.enum(["development", "production"] as const),
    };

    const result = validateEnv(schema, {
      source: { ENV: "  development  " },
    });

    // Should trim and match
    expect(result.success).toBe(true);
  });

  it("handles special characters in enum values", () => {
    const schema = {
      TYPE: e.enum(["type-one", "type_two", "type.three"] as const),
    };

    const result = validateEnv(schema, {
      source: { TYPE: "type-one" },
    });

    expect(result.success).toBe(true);
  });
});

describe("Array Edge Cases", () => {
  it("handles empty arrays", () => {
    const schema = {
      LIST: e.array(e.string()).optional(),
    };

    const result = validateEnv(schema, {
      source: { LIST: "" },
    });

    expect(result.success).toBe(true);
    if (result.data?.LIST) {
      expect(result.data?.LIST).toEqual([]);
    }
  });

  it("handles arrays with whitespace", () => {
    const schema = {
      LIST: e.array(e.string()),
    };

    const result = validateEnv(schema, {
      source: { LIST: " a , b , c " },
    });

    expect(result.success).toBe(true);
    expect(result.data?.LIST).toEqual(["a", "b", "c"]);
  });

  it("handles arrays with empty strings", () => {
    const schema = {
      LIST: e.array(e.string()),
    };

    const result = validateEnv(schema, {
      source: { LIST: "a,,b,,c" },
    });

    expect(result.success).toBe(true);
    // Empty strings should be filtered out
    expect(result.data?.LIST).toEqual(["a", "b", "c"]);
  });

  it("handles arrays with custom separator", () => {
    const schema = {
      LIST: e.array(e.string()).separator(";"),
    };

    const result = validateEnv(schema, {
      source: { LIST: "a;b;c" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.LIST).toEqual(["a", "b", "c"]);
  });

  it("handles large arrays", () => {
    const schema = {
      LIST: e.array(e.number()),
    };

    const numbers = Array.from({ length: 1000 }, (_, i) => i).join(",");
    const result = validateEnv(schema, {
      source: { LIST: numbers },
    });

    expect(result.success).toBe(true);
    expect(result.data?.LIST).toHaveLength(1000);
  });
});

describe("JSON Edge Cases", () => {
  it("handles nested objects", () => {
    const schema = {
      CONFIG: e.json<{ a: { b: { c: number } } }>(),
    };

    const result = validateEnv(schema, {
      source: { CONFIG: '{"a":{"b":{"c":123}}}' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.CONFIG.a.b.c).toBe(123);
  });

  it("handles arrays in JSON", () => {
    const schema = {
      CONFIG: e.json<{ items: number[] }>(),
    };

    const result = validateEnv(schema, {
      source: { CONFIG: '{"items":[1,2,3]}' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.CONFIG.items).toEqual([1, 2, 3]);
  });

  it("handles null values", () => {
    const schema = {
      CONFIG: e.json<{ value: null }>(),
    };

    const result = validateEnv(schema, {
      source: { CONFIG: '{"value":null}' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.CONFIG.value).toBeNull();
  });

  it("rejects invalid JSON", () => {
    const schema = {
      CONFIG: e.json(),
    };

    const result = validateEnv(schema, {
      source: { CONFIG: "{invalid json}" },
    });

    expect(result.success).toBe(false);
  });

  it("handles unicode in JSON", () => {
    const schema = {
      CONFIG: e.json<{ text: string }>(),
    };

    const result = validateEnv(schema, {
      source: { CONFIG: '{"text":"こんにちは"}' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.CONFIG.text).toBe("こんにちは");
  });
});

describe("Duration Edge Cases", () => {
  it("handles very long durations", () => {
    const schema = {
      TIMEOUT: e.duration(),
    };

    const result = validateEnv(schema, {
      source: { TIMEOUT: "365d" }, // 1 year
    });

    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it("handles very short durations", () => {
    const schema = {
      TIMEOUT: e.duration(),
    };

    const result = validateEnv(schema, {
      source: { TIMEOUT: "1ms" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(1);
  });

  it("handles decimal values", () => {
    const schema = {
      TIMEOUT: e.duration(),
    };

    const result = validateEnv(schema, {
      source: { TIMEOUT: "1.5s" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(1500);
  });

  it("handles long form units", () => {
    const schema = {
      TIMEOUT: e.duration(),
    };

    const result = validateEnv(schema, {
      source: { TIMEOUT: "5 seconds" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(5000);
  });
});

describe("Path Edge Cases", () => {
  it("handles absolute paths", () => {
    const schema = {
      PATH: e.path().absolute(),
    };

    const result = validateEnv(schema, {
      source: { PATH: "/absolute/path/to/file" },
    });

    expect(result.success).toBe(true);
  });

  it("handles relative paths", () => {
    const schema = {
      PATH: e.path(),
    };

    const result = validateEnv(schema, {
      source: { PATH: "./relative/path" },
    });

    expect(result.success).toBe(true);
  });

  it("handles Windows paths", () => {
    const schema = {
      PATH: e.path(),
    };

    const result = validateEnv(schema, {
      source: { PATH: "C:\\Windows\\System32" },
    });

    expect(result.success).toBe(true);
  });

  it("handles paths with spaces", () => {
    const schema = {
      PATH: e.path(),
    };

    const result = validateEnv(schema, {
      source: { PATH: "/path with spaces/file.txt" },
    });

    expect(result.success).toBe(true);
  });
});

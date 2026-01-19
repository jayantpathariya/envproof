/**
 * Tests for new schema features: transform, custom, array, duration, path, IP
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { e, validateEnv, parseDotenv } from "../src";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Transform", () => {
  it("should apply single transform", () => {
    const schema = {
      NAME: e.string().transform((s) => s.toUpperCase()),
    };
    const result = validateEnv(schema, { source: { NAME: "hello" } });
    expect(result.success).toBe(true);
    expect(result.data?.NAME).toBe("HELLO");
  });

  it("should apply multiple transforms in order", () => {
    const schema = {
      NAME: e
        .string()
        .transform((s) => s.trim())
        .transform((s) => s.toLowerCase()),
    };
    const result = validateEnv(schema, { source: { NAME: "  HELLO WORLD  " } });
    expect(result.success).toBe(true);
    expect(result.data?.NAME).toBe("hello world");
  });

  it("should apply transform to numbers", () => {
    const schema = {
      PORT: e.number().transform((n) => n + 1000),
    };
    const result = validateEnv(schema, { source: { PORT: "3000" } });
    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(4000);
  });
});

describe("Custom Validator", () => {
  it("should validate with boolean return", () => {
    const schema = {
      API_KEY: e
        .string()
        .custom((value) => value.startsWith("sk_"), "Must start with sk_"),
    };

    const valid = validateEnv(schema, { source: { API_KEY: "sk_test123" } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, { source: { API_KEY: "pk_test123" } });
    expect(invalid.success).toBe(false);
  });

  it("should validate with object return", () => {
    const schema = {
      PORT: e.number().custom((value) => {
        if (value < 1024) {
          return { valid: false, message: "Port must be >= 1024" };
        }
        return { valid: true };
      }),
    };

    const valid = validateEnv(schema, { source: { PORT: "3000" } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, { source: { PORT: "80" } });
    expect(invalid.success).toBe(false);
  });
});

describe("Array Schema", () => {
  it("should parse comma-separated strings", () => {
    const schema = {
      ORIGINS: e.array(e.string()),
    };
    const result = validateEnv(schema, {
      source: { ORIGINS: "http://localhost,http://example.com" },
    });
    expect(result.success).toBe(true);
    expect(result.data?.ORIGINS).toEqual([
      "http://localhost",
      "http://example.com",
    ]);
  });

  it("should parse comma-separated numbers", () => {
    const schema = {
      PORTS: e.array(e.number()),
    };
    const result = validateEnv(schema, {
      source: { PORTS: "3000,4000,5000" },
    });
    expect(result.success).toBe(true);
    expect(result.data?.PORTS).toEqual([3000, 4000, 5000]);
  });

  it("should use custom separator", () => {
    const schema = {
      ITEMS: e.array(e.string()).separator(";"),
    };
    const result = validateEnv(schema, {
      source: { ITEMS: "foo;bar;baz" },
    });
    expect(result.success).toBe(true);
    expect(result.data?.ITEMS).toEqual(["foo", "bar", "baz"]);
  });

  it("should validate minLength", () => {
    const schema = {
      ITEMS: e.array(e.string()).minLength(2),
    };

    const valid = validateEnv(schema, { source: { ITEMS: "a,b,c" } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, { source: { ITEMS: "a" } });
    expect(invalid.success).toBe(false);
  });

  it("should validate item schemas", () => {
    const schema = {
      PORTS: e.array(e.number().port()),
    };

    const valid = validateEnv(schema, { source: { PORTS: "3000,8080" } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, { source: { PORTS: "3000,99999" } });
    expect(invalid.success).toBe(false);
  });
});

describe("Duration Schema", () => {
  it("should parse seconds", () => {
    const schema = { TIMEOUT: e.duration() };
    const result = validateEnv(schema, { source: { TIMEOUT: "30s" } });
    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(30000);
  });

  it("should parse minutes", () => {
    const schema = { TIMEOUT: e.duration() };
    const result = validateEnv(schema, { source: { TIMEOUT: "5m" } });
    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(5 * 60 * 1000);
  });

  it("should parse hours", () => {
    const schema = { TTL: e.duration() };
    const result = validateEnv(schema, { source: { TTL: "2h" } });
    expect(result.success).toBe(true);
    expect(result.data?.TTL).toBe(2 * 60 * 60 * 1000);
  });

  it("should parse days", () => {
    const schema = { TTL: e.duration() };
    const result = validateEnv(schema, { source: { TTL: "7d" } });
    expect(result.success).toBe(true);
    expect(result.data?.TTL).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("should parse milliseconds", () => {
    const schema = { DELAY: e.duration() };
    const result = validateEnv(schema, { source: { DELAY: "500ms" } });
    expect(result.success).toBe(true);
    expect(result.data?.DELAY).toBe(500);
  });

  it("should validate min/max", () => {
    const schema = {
      TIMEOUT: e.duration().min("1s").max("1m"),
    };

    const valid = validateEnv(schema, { source: { TIMEOUT: "30s" } });
    expect(valid.success).toBe(true);

    const tooSmall = validateEnv(schema, { source: { TIMEOUT: "500ms" } });
    expect(tooSmall.success).toBe(false);

    const tooBig = validateEnv(schema, { source: { TIMEOUT: "2m" } });
    expect(tooBig.success).toBe(false);
  });

  it("should accept string defaults", () => {
    const schema = {
      TIMEOUT: e.duration().default("30s"),
      TTL: e.duration().default("1h"),
      EXPIRY: e.duration().default("24h"),
    };

    const result = validateEnv(schema, { source: {} });
    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(30000); // 30 seconds
    expect(result.data?.TTL).toBe(3600000); // 1 hour
    expect(result.data?.EXPIRY).toBe(86400000); // 24 hours
  });

  it("should accept number defaults (milliseconds)", () => {
    const schema = {
      TIMEOUT: e.duration().default(5000),
    };

    const result = validateEnv(schema, { source: {} });
    expect(result.success).toBe(true);
    expect(result.data?.TIMEOUT).toBe(5000);
  });
});

describe("IP Validation", () => {
  it("should validate IPv4 addresses", () => {
    const schema = { IP: e.string().ip({ version: "v4" }) };

    const valid = validateEnv(schema, { source: { IP: "192.168.1.1" } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, { source: { IP: "999.999.999.999" } });
    expect(invalid.success).toBe(false);

    const v6 = validateEnv(schema, { source: { IP: "::1" } });
    expect(v6.success).toBe(false);
  });

  it("should validate IPv6 addresses", () => {
    const schema = { IP: e.string().ip({ version: "v6" }) };

    const valid = validateEnv(schema, {
      source: { IP: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" },
    });
    expect(valid.success).toBe(true);

    const v4 = validateEnv(schema, { source: { IP: "192.168.1.1" } });
    expect(v4.success).toBe(false);
  });

  it("should validate any IP version by default", () => {
    const schema = { IP: e.string().ip() };

    const v4 = validateEnv(schema, { source: { IP: "192.168.1.1" } });
    expect(v4.success).toBe(true);

    const v6 = validateEnv(schema, {
      source: { IP: "2001:0db8:85a3:0000:0000:8a2e:0370:7334" },
    });
    expect(v6.success).toBe(true);
  });
});

describe("Path Schema", () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envproof-test-"));
    tempFile = path.join(tempDir, "test.txt");
    fs.writeFileSync(tempFile, "test content");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should validate existing paths", () => {
    const schema = { CONFIG: e.path().exists() };

    const valid = validateEnv(schema, { source: { CONFIG: tempFile } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, {
      source: { CONFIG: "/nonexistent/path" },
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate files", () => {
    const schema = { CONFIG: e.path().isFile() };

    const file = validateEnv(schema, { source: { CONFIG: tempFile } });
    expect(file.success).toBe(true);

    const dir = validateEnv(schema, { source: { CONFIG: tempDir } });
    expect(dir.success).toBe(false);
  });

  it("should validate directories", () => {
    const schema = { DIR: e.path().isDirectory() };

    const dir = validateEnv(schema, { source: { DIR: tempDir } });
    expect(dir.success).toBe(true);

    const file = validateEnv(schema, { source: { DIR: tempFile } });
    expect(file.success).toBe(false);
  });

  it("should validate absolute paths", () => {
    const schema = { PATH: e.path().absolute() };

    const abs = validateEnv(schema, { source: { PATH: tempFile } });
    expect(abs.success).toBe(true);

    const rel = validateEnv(schema, { source: { PATH: "./relative/path" } });
    expect(rel.success).toBe(false);
  });
});

describe("Dotenv Loading", () => {
  it("should parse simple .env content", () => {
    const content = `
FOO=bar
BAZ=qux
`;
    const result = parseDotenv(content);
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("should handle quoted values", () => {
    const content = `
SINGLE='hello world'
DOUBLE="hello world"
`;
    const result = parseDotenv(content);
    expect(result.SINGLE).toBe("hello world");
    expect(result.DOUBLE).toBe("hello world");
  });

  it("should handle comments", () => {
    const content = `
# This is a comment
FOO=bar # inline comment
`;
    const result = parseDotenv(content);
    expect(result).toEqual({ FOO: "bar" });
  });

  it("should handle escape sequences in double quotes", () => {
    const content = `
MESSAGE="Hello\\nWorld"
`;
    const result = parseDotenv(content);
    expect(result.MESSAGE).toBe("Hello\nWorld");
  });
});

describe("Multi-Environment Support", () => {
  it("should make variables required in production", () => {
    const schema = {
      API_KEY: e.string().optional(),
      PORT: e.number().default(3000),
    };

    // In production, API_KEY should be required
    const prodResult = validateEnv(schema, {
      source: { PORT: "8080" },
      environment: "production",
      requireInProduction: ["API_KEY"],
    });
    expect(prodResult.success).toBe(false);

    const prodWithKey = validateEnv(schema, {
      source: { PORT: "8080", API_KEY: "secret" },
      environment: "production",
      requireInProduction: ["API_KEY"],
    });
    expect(prodWithKey.success).toBe(true);
  });

  it("should make variables optional in development", () => {
    const schema = {
      API_KEY: e.string(),
      PORT: e.number().default(3000),
    };

    // In development, API_KEY should be optional
    const devResult = validateEnv(schema, {
      source: { PORT: "3000" },
      environment: "development",
      optionalInDevelopment: ["API_KEY"],
    });
    expect(devResult.success).toBe(true);
    expect(devResult.data?.API_KEY).toBeUndefined();
  });

  it("should work with 'dev' shorthand", () => {
    const schema = { API_KEY: e.string() };
    const result = validateEnv(schema, {
      source: {},
      environment: "dev",
      optionalInDevelopment: ["API_KEY"],
    });
    expect(result.success).toBe(true);
  });

  it("should pass through when no environment modifications needed", () => {
    const schema = { PORT: e.number().default(3000) };
    const result = validateEnv(schema, {
      source: {},
      environment: "staging",
    });
    expect(result.success).toBe(true);
  });
});

describe("Path Schema - Additional Coverage", () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envproof-test-"));
    tempFile = path.join(tempDir, "test.txt");
    fs.writeFileSync(tempFile, "test content");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should validate relative paths", () => {
    const schema = { PATH: e.path().relative() };

    const rel = validateEnv(schema, { source: { PATH: "./relative/path" } });
    expect(rel.success).toBe(true);

    const abs = validateEnv(schema, { source: { PATH: tempFile } });
    expect(abs.success).toBe(false);
  });

  it("should validate file extensions", () => {
    const schema = { CONFIG: e.path().extension(".json") };

    const valid = validateEnv(schema, {
      source: { CONFIG: "/path/to/config.json" },
    });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, {
      source: { CONFIG: "/path/to/config.yaml" },
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate multiple extensions", () => {
    const schema = { CONFIG: e.path().extension([".json", ".yaml"]) };

    const json = validateEnv(schema, {
      source: { CONFIG: "/path/to/config.json" },
    });
    expect(json.success).toBe(true);

    const yaml = validateEnv(schema, {
      source: { CONFIG: "/path/to/config.yaml" },
    });
    expect(yaml.success).toBe(true);

    const txt = validateEnv(schema, {
      source: { CONFIG: "/path/to/config.txt" },
    });
    expect(txt.success).toBe(false);
  });

  it("should validate readable paths", () => {
    const schema = { CONFIG: e.path().readable() };
    const result = validateEnv(schema, { source: { CONFIG: tempFile } });
    expect(result.success).toBe(true);
  });

  it("should validate writable paths", () => {
    const schema = { DIR: e.path().writable() };
    const result = validateEnv(schema, { source: { DIR: tempDir } });
    expect(result.success).toBe(true);
  });

  it("should reject empty paths", () => {
    const schema = { PATH: e.path() };
    const result = validateEnv(schema, { source: { PATH: "   " } });
    expect(result.success).toBe(false);
  });
});

describe("Array Schema - Additional Coverage", () => {
  it("should validate maxLength", () => {
    const schema = { ITEMS: e.array(e.string()).maxLength(2) };

    const valid = validateEnv(schema, { source: { ITEMS: "a,b" } });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, { source: { ITEMS: "a,b,c" } });
    expect(invalid.success).toBe(false);
  });

  it("should validate nonEmpty", () => {
    const schema = { ITEMS: e.array(e.string()).nonEmpty() };

    const valid = validateEnv(schema, { source: { ITEMS: "a" } });
    expect(valid.success).toBe(true);
  });

  it("should handle invalid item coercion", () => {
    const schema = { NUMS: e.array(e.number()) };
    const result = validateEnv(schema, { source: { NUMS: "1,abc,3" } });
    expect(result.success).toBe(false);
  });

  it("should get type description", () => {
    const schema = e.array(e.string());
    expect(schema.getTypeDescription()).toBe("array of string");
  });

  it("should get example", () => {
    const schema = e.array(e.string());
    expect(schema.getExample()).toContain(",");
  });
});

describe("Duration Schema - Additional Coverage", () => {
  it("should parse pure numbers as milliseconds", () => {
    const schema = { DELAY: e.duration() };
    const result = validateEnv(schema, { source: { DELAY: "500" } });
    expect(result.success).toBe(true);
    expect(result.data?.DELAY).toBe(500);
  });

  it("should parse weeks", () => {
    const schema = { TTL: e.duration() };
    const result = validateEnv(schema, { source: { TTL: "2w" } });
    expect(result.success).toBe(true);
    expect(result.data?.TTL).toBe(2 * 7 * 24 * 60 * 60 * 1000);
  });

  it("should reject invalid duration format", () => {
    const schema = { DELAY: e.duration() };
    const result = validateEnv(schema, { source: { DELAY: "invalid" } });
    expect(result.success).toBe(false);
  });

  it("should get type description", () => {
    const schema = e.duration();
    expect(schema.getTypeDescription()).toContain("duration");
  });
});

describe("URL Schema - Additional Coverage", () => {
  it("should validate http() shorthand", () => {
    const schema = { URL: e.url().http() };

    const valid = validateEnv(schema, {
      source: { URL: "https://example.com" },
    });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, {
      source: { URL: "ftp://example.com" },
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate withPath()", () => {
    const schema = { URL: e.url().withPath() };

    const valid = validateEnv(schema, {
      source: { URL: "https://example.com/path" },
    });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, {
      source: { URL: "https://example.com" },
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate host()", () => {
    const schema = { URL: e.url().host("example.com") };

    const valid = validateEnv(schema, {
      source: { URL: "https://example.com/path" },
    });
    expect(valid.success).toBe(true);

    const invalid = validateEnv(schema, {
      source: { URL: "https://other.com" },
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate specific protocols", () => {
    const schema = { URL: e.url().protocols(["wss"]) };

    const valid = validateEnv(schema, {
      source: { URL: "wss://socket.example.com" },
    });
    expect(valid.success).toBe(true);
  });
});

describe("Dotenv - Additional Coverage", () => {
  it("should handle lines without equals sign", () => {
    const content = `
FOO=bar
INVALID_LINE
BAZ=qux
`;
    const result = parseDotenv(content);
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("should handle empty keys", () => {
    const content = `=value`;
    const result = parseDotenv(content);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("should handle escape sequences", () => {
    const content = `
TAB="Hello\\tWorld"
QUOTE="say \\"hello\\""
`;
    const result = parseDotenv(content);
    expect(result.TAB).toBe("Hello\tWorld");
    expect(result.QUOTE).toBe('say "hello"');
  });
});

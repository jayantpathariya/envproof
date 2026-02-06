/**
 * EnvProof - CLI Tests
 * Validate CLI commands and argument parsing
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { runCheck } from "../src/cli/check.js";
import { runGenerate } from "../src/cli/generate.js";
import { runInit } from "../src/cli/init.js";
import { parseArgs } from "../src/cli/args.js";
import { getCliVersion } from "../src/cli/version.js";

const repoRoot = process.cwd();
const srcIndexUrl = pathToFileURL(path.join(repoRoot, "src/index.js")).href;

function writeSchemaFile(
  dir: string,
  content: string,
  filename = "env.config.mjs"
): string {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("CLI", () => {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envproof-cli-"));
    process.chdir(tempDir);
    process.env = { ...originalEnv };
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  it("returns success for valid schema", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number().default(3000),
};`
    );

    const exitCode = await runCheck();
    expect(exitCode).toBe(0);
  });

  it("returns failure when required variable is missing", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  API_KEY: e.string(),
};`
    );

    const exitCode = await runCheck();
    expect(exitCode).toBe(1);
  });

  it("supports strict mode for unknown variables", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number(),
};`
    );

    const exitCode = await runCheck({
      strict: true,
      schema: "env.config.mjs",
    });

    expect(exitCode).toBe(1);
  });

  it("generates .env.example file", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number().default(3000),
};`
    );

    const exitCode = await runGenerate();
    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(process.cwd(), ".env.example"))).toBe(true);
  });

  it("fails when output exists without force", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number().default(3000),
};`
    );
    fs.writeFileSync(path.join(process.cwd(), ".env.example"), "# existing");

    const exitCode = await runGenerate();
    expect(exitCode).toBe(1);
  });

  it("overwrites output with force option", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number().default(3000),
};`
    );
    const outputPath = path.join(process.cwd(), ".env.example");
    fs.writeFileSync(outputPath, "# existing");

    const exitCode = await runGenerate({ force: true });

    expect(exitCode).toBe(0);
    expect(fs.readFileSync(outputPath, "utf-8")).toContain("PORT=");
  });

  it("supports custom output path", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number().default(3000),
};`
    );

    const exitCode = await runGenerate({ output: ".env.template" });
    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(process.cwd(), ".env.template"))).toBe(true);
  });

  it("handles schema file not found", async () => {
    const exitCode = await runCheck();
    expect(exitCode).toBe(1);
  });

  it("handles invalid schema module", async () => {
    writeSchemaFile(
      process.cwd(),
      `export const notASchema = { invalid: true };`
    );

    const exitCode = await runCheck();
    expect(exitCode).toBe(1);
  });

  it("uses json reporter", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  API_KEY: e.string(),
};`
    );

    const exitCode = await runCheck({ reporter: "json" });
    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalled();

    const output = String(errorSpy.mock.calls.at(-1)?.[0] ?? "");
    const parsed = JSON.parse(output) as { success: boolean; errorCount: number };
    expect(parsed.success).toBe(false);
    expect(parsed.errorCount).toBeGreaterThan(0);
  });

  it("uses minimal reporter", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  API_KEY: e.string(),
};`
    );

    const exitCode = await runCheck({ reporter: "minimal" });
    expect(exitCode).toBe(1);

    const output = String(errorSpy.mock.calls.at(-1)?.[0] ?? "");
    expect(output).toContain("API_KEY");
    expect(output).toContain("EnvProof:");
  });

  it("searches for schema in default locations", async () => {
    writeSchemaFile(
      process.cwd(),
      `import { e } from "${srcIndexUrl}";
export const schema = {
  PORT: e.number().default(3000),
};`,
      "env.config.mjs"
    );

    const exitCode = await runCheck();
    expect(exitCode).toBe(0);
  });

  it("handles schema loading errors gracefully", async () => {
    writeSchemaFile(process.cwd(), `throw new Error("Intentional load error");`);

    const exitCode = await runCheck();
    expect(exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("scaffolds files with init command", () => {
    const exitCode = runInit();

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(process.cwd(), "env.config.ts"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), ".env.example"))).toBe(true);
  });

  it("fails init when files exist without force", () => {
    fs.writeFileSync(path.join(process.cwd(), "env.config.ts"), "existing");
    fs.writeFileSync(path.join(process.cwd(), ".env.example"), "existing");

    const exitCode = runInit();
    expect(exitCode).toBe(1);
  });

  it("overwrites init files with force", () => {
    fs.writeFileSync(path.join(process.cwd(), "env.config.ts"), "existing");
    fs.writeFileSync(path.join(process.cwd(), ".env.example"), "existing");

    const exitCode = runInit({ force: true });
    expect(exitCode).toBe(0);
    expect(
      fs.readFileSync(path.join(process.cwd(), "env.config.ts"), "utf-8")
    ).toContain("export const schema");
  });

  it("parses command-line arguments", () => {
    const parsed = parseArgs([
      "check",
      "--schema",
      "./env.ts",
      "--reporter",
      "json",
      "--strict",
    ]);

    expect(parsed.command).toBe("check");
    expect(parsed.schema).toBe("./env.ts");
    expect(parsed.reporter).toBe("json");
    expect(parsed.strict).toBe(true);
  });

  it("parses generate arguments", () => {
    const parsed = parseArgs([
      "generate",
      "--output",
      ".env.template",
      "--force",
    ]);

    expect(parsed.command).toBe("generate");
    expect(parsed.output).toBe(".env.template");
    expect(parsed.force).toBe(true);
  });

  it("parses init arguments", () => {
    const parsed = parseArgs([
      "init",
      "--schema",
      "./config/env.ts",
      "--output",
      ".env.example",
    ]);

    expect(parsed.command).toBe("init");
    expect(parsed.schema).toBe("./config/env.ts");
    expect(parsed.output).toBe(".env.example");
    expect(logSpy).toBeDefined();
  });

  it("reads version from package.json", () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "package.json"), "utf-8")
    ) as { version: string };
    expect(getCliVersion()).toBe(packageJson.version);
  });
});

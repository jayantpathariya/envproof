/**
 * EnvProof - CLI Tests
 * Validate CLI check and generate commands
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { runCheck } from "../src/cli/check.js";
import { runGenerate } from "../src/cli/generate.js";

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

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envproof-cli-"));
    process.chdir(tempDir);
    process.env = { ...originalEnv };
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
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
});

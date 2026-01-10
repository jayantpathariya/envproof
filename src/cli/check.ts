/**
 * EnvKit CLI - Check Command
 * Validate environment variables against a schema
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { EnvSchema, ReporterType } from "../types.js";
import { validate, formatErrors } from "../validation/index.js";

interface CheckOptions {
  schema?: string;
  reporter?: ReporterType;
}

/**
 * Find and load the schema file
 */
async function loadSchema(
  schemaPath?: string
): Promise<{ schema: EnvSchema; path: string } | null> {
  const searchPaths = schemaPath
    ? [schemaPath]
    : [
        "env.config.ts",
        "env.config.js",
        "env.config.mjs",
        "src/env.config.ts",
        "src/env.config.js",
        "config/env.ts",
        "config/env.js",
      ];

  for (const searchPath of searchPaths) {
    const absolutePath = path.resolve(process.cwd(), searchPath);
    if (fs.existsSync(absolutePath)) {
      try {
        // Dynamic import for ES modules
        const module = await import(absolutePath);
        const schema = module.default ?? module.schema ?? module.env;

        if (schema && typeof schema === "object") {
          return { schema, path: absolutePath };
        }
      } catch (error) {
        console.error(`Failed to load schema from ${searchPath}:`, error);
      }
    }
  }

  return null;
}

/**
 * Run the check command
 */
export async function runCheck(options: CheckOptions = {}): Promise<number> {
  const result = await loadSchema(options.schema);

  if (!result) {
    console.error("❌ Could not find env schema file.");
    console.error("");
    console.error("Searched for:");
    console.error("  - env.config.ts");
    console.error("  - env.config.js");
    console.error("  - src/env.config.ts");
    console.error("");
    console.error("Create a schema file or specify with --schema <path>");
    return 1;
  }

  console.log(`📋 Using schema: ${path.relative(process.cwd(), result.path)}`);
  console.log("");

  const validation = validate(result.schema, process.env, {});

  if (validation.success) {
    console.log("✅ All environment variables are valid!");
    console.log(`   ${Object.keys(result.schema).length} variables checked`);
    return 0;
  }

  const formatted = formatErrors(
    validation.errors,
    options.reporter ?? "pretty"
  );
  console.error(formatted);
  return 1;
}

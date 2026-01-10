/**
 * EnvKit CLI - Generate Command
 * Generate .env.example from schema
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { EnvSchema } from "../types.js";
import { writeExampleFile } from "../generator/index.js";

interface GenerateOptions {
  schema?: string;
  output?: string;
  force?: boolean;
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
        // Dynamic import for ES modules - use file:// URL for Windows compatibility
        const fileUrl = new URL(`file:///${absolutePath.replace(/\\/g, "/")}`);
        const module = await import(fileUrl.href);
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
 * Run the generate command
 */
export async function runGenerate(
  options: GenerateOptions = {}
): Promise<number> {
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

  const writeResult = writeExampleFile(result.schema, {
    ...(options.output !== undefined && { output: options.output }),
    ...(options.force !== undefined && { force: options.force }),
  });

  if (writeResult.success) {
    console.log(`✅ ${writeResult.message}`);
    console.log(`   ${Object.keys(result.schema).length} variables documented`);
    return 0;
  }

  console.error(`❌ ${writeResult.message}`);
  return 1;
}

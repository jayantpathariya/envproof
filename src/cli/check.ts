/**
 * EnvProof CLI - Check Command
 * Validate environment variables against a schema
 */

import * as path from "node:path";
import type { ReporterType } from "../types.js";
import { validate, formatErrors } from "../validation/index.js";
import { loadSchema, getSchemaSearchPaths } from "./schema-loader.js";

interface CheckOptions {
  schema?: string;
  reporter?: ReporterType;
  strict?: boolean;
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
    for (const searchPath of getSchemaSearchPaths(options.schema)) {
      console.error(`  - ${searchPath}`);
    }
    console.error("");
    console.error("Create a schema file or specify with --schema <path>");
    return 1;
  }

  console.log(`📋 Using schema: ${path.relative(process.cwd(), result.path)}`);
  console.log("");

  const validation = validate(result.schema, process.env, {
    ...(options.strict !== undefined && { strict: options.strict }),
  });

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

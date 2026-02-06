/**
 * EnvProof CLI - Generate Command
 * Generate .env.example from schema
 */

import * as path from "node:path";
import { writeExampleFile } from "../generator/index.js";
import { loadSchema, getSchemaSearchPaths } from "./schema-loader.js";

interface GenerateOptions {
  schema?: string;
  output?: string;
  force?: boolean;
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
    for (const searchPath of getSchemaSearchPaths(options.schema)) {
      console.error(`  - ${searchPath}`);
    }
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

/**
 * EnvProof CLI - Shared Schema Loader
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { AnySchema, EnvSchema } from "../types.js";

export const DEFAULT_SCHEMA_PATHS = [
  "env.config.ts",
  "env.config.js",
  "env.config.mjs",
  "src/env.config.ts",
  "src/env.config.js",
  "config/env.ts",
  "config/env.js",
] as const;

interface LoadedSchema {
  schema: EnvSchema;
  path: string;
}

/**
 * Return search paths for schema discovery.
 */
export function getSchemaSearchPaths(schemaPath?: string): string[] {
  if (schemaPath) {
    return [schemaPath];
  }
  return [...DEFAULT_SCHEMA_PATHS];
}

/**
 * Load schema from file path(s).
 */
export async function loadSchema(
  schemaPath?: string
): Promise<LoadedSchema | null> {
  const searchPaths = getSchemaSearchPaths(schemaPath);

  for (const searchPath of searchPaths) {
    const absolutePath = path.resolve(process.cwd(), searchPath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    try {
      const moduleUrl = pathToFileURL(absolutePath).href;
      const module = await import(moduleUrl);
      const candidate = module.default ?? module.schema ?? module.env;

      if (isEnvSchema(candidate)) {
        return { schema: candidate, path: absolutePath };
      }
    } catch (error) {
      console.error(`Failed to load schema from ${searchPath}:`, error);
    }
  }

  return null;
}

/**
 * Runtime guard for schema-like objects.
 */
function isEnvSchema(value: unknown): value is EnvSchema {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }

  for (const [, schema] of entries) {
    if (!isSchemaField(schema)) {
      return false;
    }
  }

  return true;
}

function isSchemaField(value: unknown): value is AnySchema {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AnySchema>;
  return (
    typeof candidate.getTypeDescription === "function" &&
    typeof candidate.getExample === "function" &&
    typeof candidate._def === "object"
  );
}

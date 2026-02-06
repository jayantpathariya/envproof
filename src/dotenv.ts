/**
 * EnvProof - Dotenv Loader
 * Simple .env file parser (zero dependencies)
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Parse a .env file content into key-value pairs
 */
export function parseDotenv(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Find the first = sign
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Skip if key is empty
    if (!key) {
      continue;
    }

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
      // Handle escape sequences in double-quoted strings
      if (
        trimmed
          .slice(eqIndex + 1)
          .trim()
          .startsWith('"')
      ) {
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\")
          .replace(/\\"/g, '"');
      }
    } else {
      // Remove inline comments from unquoted values
      const commentIndex = value.indexOf(" #");
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    result[key] = value;
  }

  return result;
}

/**
 * Load environment variables from a .env file
 *
 * @param filePath - Path to the .env file (default: '.env')
 * @returns Key-value pairs from the file, or empty object if file doesn't exist
 *
 * @example
 * ```typescript
 * const vars = loadDotenv('.env.local');
 * // { DATABASE_URL: 'postgres://...', PORT: '3000' }
 * ```
 */
export function loadDotenv(filePath: string = ".env"): Record<string, string> {
  const resolvedPath = path.resolve(process.cwd(), filePath);

  try {
    const content = fs.readFileSync(resolvedPath, "utf-8");
    return parseDotenv(content);
  } catch {
    // File doesn't exist or can't be read - return empty object
    // This is not an error condition, since .env files are optional
    return {};
  }
}

/**
 * Load and merge multiple .env files
 * Later files take precedence over earlier ones
 *
 * @param paths - Paths to .env files (processed in order)
 * @returns Merged key-value pairs
 */
export function loadDotenvFiles(...paths: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const filePath of paths) {
    const vars = loadDotenv(filePath);
    // Use Object.assign for better performance
    Object.assign(result, vars);
  }

  return result;
}

/**
 * Expand ${VAR} references in dotenv values.
 * Variables from `vars` take precedence over `context`.
 */
export function expandDotenvVars(
  vars: Record<string, string>,
  context: Record<string, string | undefined> = process.env
): Record<string, string> {
  const result: Record<string, string> = {};
  const resolving = new Set<string>();
  const pattern = /\\?\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

  const resolveKey = (key: string): string => {
    if (result[key] !== undefined) {
      return result[key];
    }

    if (resolving.has(key)) {
      return "";
    }

    const raw = vars[key];
    if (raw === undefined) {
      return "";
    }

    resolving.add(key);
    const expanded = raw.replace(pattern, (match, varName: string) => {
      if (match.startsWith("\\")) {
        return match.slice(1);
      }

      if (Object.prototype.hasOwnProperty.call(vars, varName)) {
        return resolveKey(varName);
      }

      return context[varName] ?? "";
    });
    resolving.delete(key);
    result[key] = expanded;
    return expanded;
  };

  for (const key of Object.keys(vars)) {
    resolveKey(key);
  }

  return result;
}

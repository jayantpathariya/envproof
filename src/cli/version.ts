/**
 * EnvProof CLI - Version Helper
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJsonLike {
  version?: unknown;
}

/**
 * Read package version from package.json.
 */
export function getCliVersion(): string {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const packagePath = path.resolve(currentDir, "../../package.json");
    const raw = fs.readFileSync(packagePath, "utf-8");
    const pkg = JSON.parse(raw) as PackageJsonLike;

    if (typeof pkg.version === "string" && pkg.version.length > 0) {
      return pkg.version;
    }
  } catch {
    // Fall back to unknown version
  }

  return "0.0.0";
}

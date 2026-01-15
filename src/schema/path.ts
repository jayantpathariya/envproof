/**
 * EnvProof - Path Schema
 * Schema for file/directory path environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";
import * as fs from "fs";
import * as nodePath from "path";

/**
 * Schema for file path environment variables
 * Validates paths with optional existence and permission checks
 *
 * @example
 * ```typescript
 * // CONFIG_PATH=/etc/app/config.json
 * e.path().exists().isFile()
 *
 * // LOG_DIR=/var/log/app
 * e.path().exists().isDirectory().writable()
 * ```
 */
export class PathSchema<Optional extends boolean = false> extends BaseSchema<
  string,
  Optional
> {
  constructor() {
    super("path", coercePath);
  }

  /**
   * Require the path to exist
   */
  exists(): this {
    return this.refine(
      (value) => {
        try {
          fs.accessSync(value);
          return true;
        } catch {
          return false;
        }
      },
      "Path does not exist",
      "exists"
    );
  }

  /**
   * Require the path to be a file
   */
  isFile(): this {
    return this.refine(
      (value) => {
        try {
          return fs.statSync(value).isFile();
        } catch {
          return false;
        }
      },
      "Must be a file",
      "isFile"
    );
  }

  /**
   * Require the path to be a directory
   */
  isDirectory(): this {
    return this.refine(
      (value) => {
        try {
          return fs.statSync(value).isDirectory();
        } catch {
          return false;
        }
      },
      "Must be a directory",
      "isDirectory"
    );
  }

  /**
   * Require the path to be readable
   */
  readable(): this {
    return this.refine(
      (value) => {
        try {
          fs.accessSync(value, fs.constants.R_OK);
          return true;
        } catch {
          return false;
        }
      },
      "Path is not readable",
      "readable"
    );
  }

  /**
   * Require the path to be writable
   */
  writable(): this {
    return this.refine(
      (value) => {
        try {
          fs.accessSync(value, fs.constants.W_OK);
          return true;
        } catch {
          return false;
        }
      },
      "Path is not writable",
      "writable"
    );
  }

  /**
   * Require the path to be absolute
   */
  absolute(): this {
    return this.refine(
      (value) => nodePath.isAbsolute(value),
      "Must be an absolute path",
      "absolute"
    );
  }

  /**
   * Require the path to be relative
   */
  relative(): this {
    return this.refine(
      (value) => !nodePath.isAbsolute(value),
      "Must be a relative path",
      "relative"
    );
  }

  /**
   * Require specific file extension(s)
   */
  extension(ext: string | string[]): this {
    const extensions = Array.isArray(ext) ? ext : [ext];
    const normalized = extensions.map((e) => (e.startsWith(".") ? e : `.${e}`));

    return this.refine(
      (value) => {
        const fileExt = nodePath.extname(value).toLowerCase();
        return normalized.some((e) => e.toLowerCase() === fileExt);
      },
      `Must have extension: ${normalized.join(", ")}`,
      "extension"
    );
  }

  override getTypeDescription(): string {
    const rules = this._def.rules;
    const modifiers: string[] = [];

    for (const rule of rules) {
      if (rule.name === "isFile") modifiers.push("file");
      if (rule.name === "isDirectory") modifiers.push("directory");
      if (rule.name === "exists") modifiers.push("existing");
    }

    return modifiers.length > 0 ? `path (${modifiers.join(", ")})` : "path";
  }

  protected override getDefaultExample(): string {
    return "/path/to/file";
  }
}

/**
 * Coerce string to path (identity with normalization)
 */
function coercePath(value: string): CoercionResult<string> {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { success: false, error: "Path cannot be empty" };
  }

  // Normalize the path
  const normalized = nodePath.normalize(trimmed);

  return { success: true, value: normalized };
}

/**
 * Create a new path schema
 *
 * @example
 * ```typescript
 * e.path() // Any path
 * e.path().exists() // Must exist
 * e.path().isFile().readable() // Must be a readable file
 * e.path().isDirectory().writable() // Must be a writable directory
 * ```
 */
export function path(): PathSchema {
  return new PathSchema();
}

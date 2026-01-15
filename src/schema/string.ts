/**
 * EnvProof - String Schema
 * Schema for string environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";

/**
 * Schema for string environment variables
 * No coercion needed - values are already strings
 */
export class StringSchema<Optional extends boolean = false> extends BaseSchema<
  string,
  Optional
> {
  constructor() {
    super("string", coerceString);
  }

  /**
   * Require minimum length
   */
  minLength(min: number): this {
    return this.refine(
      (value) => value.length >= min,
      `Must be at least ${min} characters`,
      "minLength"
    );
  }

  /**
   * Require maximum length
   */
  maxLength(max: number): this {
    return this.refine(
      (value) => value.length <= max,
      `Must be at most ${max} characters`,
      "maxLength"
    );
  }

  /**
   * Require exact length
   */
  length(len: number): this {
    return this.refine(
      (value) => value.length === len,
      `Must be exactly ${len} characters`,
      "length"
    );
  }

  /**
   * Require value to match pattern
   */
  pattern(regex: RegExp, message?: string): this {
    return this.refine(
      (value) => regex.test(value),
      message ?? `Must match pattern ${regex.source}`,
      "pattern"
    );
  }

  /**
   * Require non-empty string (trims whitespace)
   */
  nonEmpty(): this {
    return this.refine(
      (value) => value.trim().length > 0,
      "Must not be empty",
      "nonEmpty"
    );
  }

  /**
   * Require value to start with prefix
   */
  startsWith(prefix: string): this {
    return this.refine(
      (value) => value.startsWith(prefix),
      `Must start with "${prefix}"`,
      "startsWith"
    );
  }

  /**
   * Require value to end with suffix
   */
  endsWith(suffix: string): this {
    return this.refine(
      (value) => value.endsWith(suffix),
      `Must end with "${suffix}"`,
      "endsWith"
    );
  }

  /**
   * Require value to be valid email format
   */
  email(): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.refine(
      (value) => emailRegex.test(value),
      "Must be a valid email address",
      "email"
    );
  }

  /**
   * Require value to be valid UUID format
   */
  uuid(): this {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return this.refine(
      (value) => uuidRegex.test(value),
      "Must be a valid UUID",
      "uuid"
    );
  }

  /**
   * Require value to be a valid IP address
   * @param options.version - 'v4', 'v6', or 'any' (default: 'any')
   * @example
   * ```typescript
   * e.string().ip() // any version
   * e.string().ip({ version: 'v4' }) // IPv4 only
   * e.string().ip({ version: 'v6' }) // IPv6 only
   * ```
   */
  ip(options?: { version?: "v4" | "v6" | "any" }): this {
    const version = options?.version ?? "any";

    return this.refine(
      (value) => {
        if (version === "v4" || version === "any") {
          if (isValidIPv4(value)) return true;
        }
        if (version === "v6" || version === "any") {
          if (isValidIPv6(value)) return true;
        }
        return false;
      },
      `Must be a valid IP${version !== "any" ? version.toUpperCase() : ""} address`,
      "ip"
    );
  }

  override getTypeDescription(): string {
    const rules = this._def.rules;
    const parts: string[] = ["string"];

    for (const rule of rules) {
      if (rule.name === "minLength") {
        parts.push(`min ${rule.message.match(/\d+/)?.[0]} chars`);
      } else if (rule.name === "maxLength") {
        parts.push(`max ${rule.message.match(/\d+/)?.[0]} chars`);
      } else if (rule.name === "email") {
        return "email";
      } else if (rule.name === "uuid") {
        return "UUID";
      }
    }

    return parts.length > 1 ? parts.join(", ") : "string";
  }

  protected override getDefaultExample(): string {
    // Check for specific formats
    for (const rule of this._def.rules) {
      if (rule.name === "email") return "user@example.com";
      if (rule.name === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
    }
    return "your_value_here";
  }
}

/**
 * Coerce string to string (identity function)
 */
function coerceString(value: string): CoercionResult<string> {
  return { success: true, value };
}

/**
 * Validate IPv4 address
 */
function isValidIPv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) return false;
    // Reject leading zeros (e.g., "01" is invalid)
    if (part !== String(num)) return false;
  }
  return true;
}

/**
 * Validate IPv6 address
 */
function isValidIPv6(value: string): boolean {
  // Simplified IPv6 validation - handles full form and :: shorthand
  const ipv6Regex =
    /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$|^::$|^([0-9a-f]{1,4}:){1,7}:$|^:(:([0-9a-f]{1,4})){1,7}$|^([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}$|^([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}$|^([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}$|^([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}$|^([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}$|^[0-9a-f]{1,4}:(:[0-9a-f]{1,4}){1,6}$/i;
  return ipv6Regex.test(value);
}

/**
 * Create a new string schema
 */
export function string(): StringSchema {
  return new StringSchema();
}

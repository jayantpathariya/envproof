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
 * Create a new string schema
 */
export function string(): StringSchema {
  return new StringSchema();
}

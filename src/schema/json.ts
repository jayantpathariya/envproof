/**
 * EnvProof - JSON Schema
 * Schema for JSON environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";

/**
 * Schema for JSON environment variables
 * Parses string into typed JSON object
 */
export class JsonSchema<
  T = unknown,
  Optional extends boolean = false
> extends BaseSchema<T, Optional> {
  constructor() {
    super("json", coerceJson as (value: string) => CoercionResult<T>);
  }

  /**
   * Add custom validation for the parsed JSON
   */
  validate(validator: (value: T) => boolean, message: string): this {
    return this.refine(validator, message, "validate");
  }

  /**
   * Require the JSON to be an array
   */
  array(): this {
    return this.refine(
      (value) => Array.isArray(value),
      "Must be a JSON array",
      "array"
    );
  }

  /**
   * Require the JSON to be an object (not array, not null)
   */
  object(): this {
    return this.refine(
      (value) =>
        typeof value === "object" && value !== null && !Array.isArray(value),
      "Must be a JSON object",
      "object"
    );
  }

  override getTypeDescription(): string {
    return "JSON";
  }

  protected override getDefaultExample(): string {
    return '{"key":"value"}';
  }
}

/**
 * Coerce string to JSON
 */
function coerceJson(value: string): CoercionResult<unknown> {
  const trimmed = value.trim();

  if (trimmed === "") {
    return { success: false, error: "Cannot parse empty string as JSON" };
  }

  try {
    const parsed = JSON.parse(trimmed);
    return { success: true, value: parsed };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return {
      success: false,
      error: `Invalid JSON: ${message}`,
    };
  }
}

/**
 * Create a new JSON schema
 * Use generic parameter for type inference
 *
 * @example
 * const schema = {
 *   CONFIG: e.json<{ host: string; port: number }>()
 * };
 */
export function json<T = unknown>(): JsonSchema<T> {
  return new JsonSchema<T>();
}

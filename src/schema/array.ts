/**
 * EnvProof - Array Schema
 * Schema for comma-separated array environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult, AnySchema } from "../types.js";

/**
 * Schema for array environment variables
 * Parses comma-separated values into typed arrays
 *
 * @example
 * ```typescript
 * // ALLOWED_ORIGINS=http://localhost,http://example.com
 * e.array(e.string()).separator(",")
 * // Result: ["http://localhost", "http://example.com"]
 * ```
 */
export class ArraySchema<
  T,
  Optional extends boolean = false,
> extends BaseSchema<T[], Optional> {
  private itemSchema: AnySchema;
  private separatorChar: string = ",";

  constructor(itemSchema: AnySchema) {
    super("array", (value: string) => this.coerceArray(value));
    this.itemSchema = itemSchema;
  }

  /**
   * Override clone to preserve instance properties
   */
  protected override clone(
    updates: Parameters<BaseSchema<T[], Optional>["clone"]>[0]
  ): this {
    const cloned = super.clone(updates) as ArraySchema<T, Optional>;
    cloned.itemSchema = this.itemSchema;
    cloned.separatorChar = this.separatorChar;
    // Rebind coerce function to use the cloned instance
    cloned._def.coerce = (value: string) => cloned.coerceArray(value);
    return cloned as this;
  }

  /**
   * Set the separator character (default: ",")
   */
  separator(char: string): this {
    const cloned = this.clone({});
    cloned.separatorChar = char;
    // Rebind coerce function to use the new separator
    cloned._def.coerce = (value: string) => cloned.coerceArray(value);
    return cloned;
  }

  /**
   * Require minimum number of items
   */
  minLength(min: number): this {
    return this.refine(
      (value) => value.length >= min,
      `Must have at least ${min} item${min === 1 ? "" : "s"}`,
      "minLength"
    );
  }

  /**
   * Require maximum number of items
   */
  maxLength(max: number): this {
    return this.refine(
      (value) => value.length <= max,
      `Must have at most ${max} item${max === 1 ? "" : "s"}`,
      "maxLength"
    );
  }

  /**
   * Require non-empty array
   */
  nonEmpty(): this {
    return this.minLength(1);
  }

  /**
   * Coerce string to array
   */
  private coerceArray(value: string): CoercionResult<T[]> {
    const items = value
      .split(this.separatorChar)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const results: T[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!; // We know this exists from the loop condition
      const itemResult = this.itemSchema._def.coerce(item);
      if (!itemResult.success) {
        return {
          success: false,
          error: `Invalid item at index ${i}: ${itemResult.error}`,
        };
      }

      // Run item validation rules
      for (const rule of this.itemSchema._def.rules) {
        if (!rule.validate(itemResult.value)) {
          return {
            success: false,
            error: `Invalid item at index ${i}: ${rule.message}`,
          };
        }
      }

      results.push(itemResult.value as T);
    }

    return { success: true, value: results };
  }

  override getTypeDescription(): string {
    const itemType = this.itemSchema.getTypeDescription();
    return `array of ${itemType}`;
  }

  protected override getDefaultExample(): string {
    const itemExample = this.itemSchema.getExample();
    return `${itemExample}${this.separatorChar}${itemExample}`;
  }
}

/**
 * Create a new array schema
 * @param itemSchema - Schema for each item in the array
 *
 * @example
 * ```typescript
 * // Parse comma-separated strings
 * e.array(e.string())
 *
 * // Parse comma-separated numbers
 * e.array(e.number())
 *
 * // With custom separator
 * e.array(e.string()).separator(";")
 * ```
 */
export function array<T>(
  itemSchema: BaseSchema<T, boolean>
): ArraySchema<T, false> {
  return new ArraySchema<T, false>(itemSchema as unknown as AnySchema);
}

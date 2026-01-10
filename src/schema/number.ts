/**
 * EnvProof - Number Schema
 * Schema for numeric environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";

/**
 * Schema for number environment variables
 * Coerces string to number with validation
 */
export class NumberSchema<Optional extends boolean = false> extends BaseSchema<
  number,
  Optional
> {
  private _isInteger = false;
  private _min: number | undefined = undefined;
  private _max: number | undefined = undefined;

  constructor() {
    super("number", coerceNumber);
  }

  protected override clone(updates: Partial<typeof this._def>): this {
    const cloned = super.clone(updates);
    cloned._isInteger = this._isInteger;
    cloned._min = this._min;
    cloned._max = this._max;
    return cloned;
  }

  /**
   * Require integer value (no decimals)
   */
  integer(): this {
    const cloned = this.refine(
      (value) => Number.isInteger(value),
      "Must be an integer",
      "integer"
    );
    cloned._isInteger = true;
    return cloned;
  }

  /**
   * Require minimum value
   */
  min(min: number): this {
    const cloned = this.refine(
      (value) => value >= min,
      `Must be at least ${min}`,
      "min"
    );
    cloned._min = min;
    return cloned;
  }

  /**
   * Require maximum value
   */
  max(max: number): this {
    const cloned = this.refine(
      (value) => value <= max,
      `Must be at most ${max}`,
      "max"
    );
    cloned._max = max;
    return cloned;
  }

  /**
   * Require positive value (> 0)
   */
  positive(): this {
    return this.min(1);
  }

  /**
   * Require non-negative value (>= 0)
   */
  nonNegative(): this {
    return this.min(0);
  }

  /**
   * Shorthand for valid port number (1-65535, integer)
   */
  port(): this {
    return this.integer().min(1).max(65535);
  }

  /**
   * Require value to be within a range
   */
  between(min: number, max: number): this {
    return this.min(min).max(max);
  }

  override getTypeDescription(): string {
    const parts: string[] = [];

    if (this._isInteger) {
      parts.push("integer");
    } else {
      parts.push("number");
    }

    if (this._min !== undefined && this._max !== undefined) {
      parts.push(`${this._min}-${this._max}`);
    } else if (this._min !== undefined) {
      parts.push(`>= ${this._min}`);
    } else if (this._max !== undefined) {
      parts.push(`<= ${this._max}`);
    }

    return parts.join(", ");
  }

  protected override getDefaultExample(): string {
    if (this._min !== undefined) {
      return String(this._min);
    }
    if (this._isInteger) {
      return "42";
    }
    return "3.14";
  }
}

/**
 * Coerce string to number
 */
function coerceNumber(value: string): CoercionResult<number> {
  const trimmed = value.trim();

  if (trimmed === "") {
    return { success: false, error: "Cannot convert empty string to number" };
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    return { success: false, error: `Cannot convert "${value}" to number` };
  }

  if (!Number.isFinite(num)) {
    return { success: false, error: `Value "${value}" is not a finite number` };
  }

  return { success: true, value: num };
}

/**
 * Create a new number schema
 */
export function number(): NumberSchema {
  return new NumberSchema();
}

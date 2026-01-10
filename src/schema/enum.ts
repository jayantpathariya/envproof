/**
 * EnvProof - Enum Schema
 * Schema for enumerated string values
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult, SchemaDefinition } from "../types.js";

/**
 * Schema for enum environment variables
 * Values must be one of the specified options
 */
export class EnumSchema<
  T extends readonly string[],
  Optional extends boolean = false
> extends BaseSchema<T[number], Optional> {
  private readonly _values: T;

  constructor(values: T) {
    super("enum", createEnumCoercer(values));
    this._values = values;
    // Store enum values in def for documentation
    (this._def as SchemaDefinition<T[number]> & { enumValues: T }).enumValues =
      values;
  }

  protected override clone(updates: Partial<typeof this._def>): this {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned._def = { ...this._def, ...updates };
    cloned._values = this._values;
    return cloned;
  }

  /**
   * Get the allowed enum values
   */
  get values(): T {
    return this._values;
  }

  override getTypeDescription(): string {
    return `enum (${this._values.join(" | ")})`;
  }

  protected override getDefaultExample(): string {
    return this._values[0] ?? "";
  }
}

/**
 * Create a coercer for enum values
 */
function createEnumCoercer<T extends readonly string[]>(
  values: T
): (value: string) => CoercionResult<T[number]> {
  return (value: string) => {
    const trimmed = value.trim();

    if ((values as readonly string[]).includes(trimmed)) {
      return { success: true, value: trimmed as T[number] };
    }

    return {
      success: false,
      error: `Invalid value "${value}". Must be one of: ${values.join(", ")}`,
    };
  };
}

/**
 * Create a new enum schema
 */
export function enumType<T extends readonly string[]>(
  values: T
): EnumSchema<T> {
  if (values.length === 0) {
    throw new Error("Enum must have at least one value");
  }
  return new EnumSchema(values);
}

/**
 * EnvKit - Boolean Schema
 * Schema for boolean environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";
import { BOOLEAN_TRUE_VALUES, BOOLEAN_FALSE_VALUES } from "../types.js";

/**
 * Schema for boolean environment variables
 * Accepts: true/false, 1/0, yes/no, on/off (case-insensitive)
 */
export class BooleanSchema<Optional extends boolean = false> extends BaseSchema<
  boolean,
  Optional
> {
  constructor() {
    super("boolean", coerceBoolean);
  }

  override getTypeDescription(): string {
    return "boolean (true/false, 1/0, yes/no, on/off)";
  }

  protected override getDefaultExample(): string {
    return "true";
  }
}

/**
 * Coerce string to boolean
 * Accepts: true/false, 1/0, yes/no, on/off (case-insensitive)
 */
function coerceBoolean(value: string): CoercionResult<boolean> {
  const normalized = value.toLowerCase().trim();

  if ((BOOLEAN_TRUE_VALUES as readonly string[]).includes(normalized)) {
    return { success: true, value: true };
  }

  if ((BOOLEAN_FALSE_VALUES as readonly string[]).includes(normalized)) {
    return { success: true, value: false };
  }

  const validValues = [...BOOLEAN_TRUE_VALUES, ...BOOLEAN_FALSE_VALUES].join(
    ", "
  );
  return {
    success: false,
    error: `Cannot convert "${value}" to boolean. Valid values: ${validValues}`,
  };
}

/**
 * Create a new boolean schema
 */
export function boolean(): BooleanSchema {
  return new BooleanSchema();
}

/**
 * EnvKit - Validation Errors
 * Error types and collection utilities
 */

import type {
  ValidationError,
  ValidationErrorReason,
  AnySchema,
} from "../types.js";

/**
 * Create a validation error for a missing variable
 */
export function createMissingError(
  variable: string,
  schema: AnySchema
): ValidationError {
  const def = schema._def;

  return {
    variable,
    reason: "missing",
    message: "Required variable is not set",
    expected: schema.getTypeDescription(),
    example: schema.getExample(),
    isSecret: def.metadata.isSecret,
  };
}

/**
 * Create a validation error for an empty variable
 */
export function createEmptyError(
  variable: string,
  schema: AnySchema
): ValidationError {
  const def = schema._def;

  return {
    variable,
    reason: "empty",
    message: "Variable is set but empty",
    expected: schema.getTypeDescription(),
    example: schema.getExample(),
    isSecret: def.metadata.isSecret,
  };
}

/**
 * Create a validation error for type coercion failure
 */
export function createTypeError(
  variable: string,
  schema: AnySchema,
  received: string,
  coercionError: string
): ValidationError {
  const def = schema._def;

  return {
    variable,
    reason: "invalid_type",
    message: coercionError,
    expected: schema.getTypeDescription(),
    received: def.metadata.isSecret ? "[REDACTED]" : received,
    example: schema.getExample(),
    isSecret: def.metadata.isSecret,
  };
}

/**
 * Create a validation error for validation rule failure
 */
export function createValueError(
  variable: string,
  schema: AnySchema,
  received: string,
  ruleMessage: string
): ValidationError {
  const def = schema._def;

  return {
    variable,
    reason: "invalid_value",
    message: ruleMessage,
    expected: schema.getTypeDescription(),
    received: def.metadata.isSecret ? "[REDACTED]" : received,
    example: schema.getExample(),
    isSecret: def.metadata.isSecret,
  };
}

/**
 * Create a validation error for JSON parse failure
 */
export function createParseError(
  variable: string,
  schema: AnySchema,
  received: string,
  parseError: string
): ValidationError {
  const def = schema._def;

  return {
    variable,
    reason: "parse_error",
    message: parseError,
    expected: schema.getTypeDescription(),
    received: def.metadata.isSecret ? "[REDACTED]" : truncateValue(received),
    example: schema.getExample(),
    isSecret: def.metadata.isSecret,
  };
}

/**
 * Truncate long values for display
 */
function truncateValue(value: string, maxLength = 50): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

/**
 * Custom error class for validation failures
 */
export class EnvValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[], formattedMessage: string) {
    super(formattedMessage);
    this.name = "EnvValidationError";
    this.errors = errors;
  }
}

/**
 * Group errors by reason for better display
 */
export function groupErrorsByReason(
  errors: ValidationError[]
): Map<ValidationErrorReason, ValidationError[]> {
  const groups = new Map<ValidationErrorReason, ValidationError[]>();

  for (const error of errors) {
    const existing = groups.get(error.reason);
    if (existing) {
      existing.push(error);
    } else {
      groups.set(error.reason, [error]);
    }
  }

  return groups;
}

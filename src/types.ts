/**
 * EnvKit - TypeScript Types
 * Core type definitions for the validation library
 */

// ============================================================
// Schema Types
// ============================================================

/** Supported schema types */
export type SchemaType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "url"
  | "json";

/** Validation rule for schemas */
export interface ValidationRule<T = unknown> {
  name: string;
  message: string;
  validate: (value: T) => boolean;
}

/** Schema metadata for documentation and error messages */
export interface SchemaMetadata {
  description?: string;
  example?: string;
  isSecret: boolean;
}

/** Internal schema definition */
export interface SchemaDefinition<T> {
  type: SchemaType;
  isOptional: boolean;
  defaultValue?: T;
  metadata: SchemaMetadata;
  rules: ValidationRule<T>[];
  coerce: (value: string) => CoercionResult<T>;
  enumValues?: readonly string[];
}

// ============================================================
// Coercion Types
// ============================================================

/** Result of coercing a string to a typed value */
export type CoercionResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

/** Boolean string representations */
export const BOOLEAN_TRUE_VALUES = ["true", "1", "yes", "on"] as const;
export const BOOLEAN_FALSE_VALUES = ["false", "0", "no", "off"] as const;
export type BooleanTrueString = (typeof BOOLEAN_TRUE_VALUES)[number];
export type BooleanFalseString = (typeof BOOLEAN_FALSE_VALUES)[number];
export type BooleanString = BooleanTrueString | BooleanFalseString;

// ============================================================
// Validation Types
// ============================================================

/** Reason for validation failure */
export type ValidationErrorReason =
  | "missing"
  | "empty"
  | "invalid_type"
  | "invalid_value"
  | "parse_error";

/** Individual validation error */
export interface ValidationError {
  variable: string;
  reason: ValidationErrorReason;
  message: string;
  expected: string;
  received?: string;
  example?: string;
  isSecret: boolean;
}

/** Complete validation result */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

// ============================================================
// Configuration Types
// ============================================================

/** Error handling behavior */
export type OnErrorBehavior = "throw" | "exit" | "return";

/** Reporter type */
export type ReporterType = "pretty" | "json" | "minimal";

/** Custom reporter function */
export type CustomReporter = (errors: ValidationError[]) => string;

/** Configuration options for createEnv */
export interface EnvOptions {
  /** Custom source of environment variables (default: process.env) */
  source?: Record<string, string | undefined>;

  /** Only include variables with this prefix */
  prefix?: string;

  /** Remove prefix from variable names in output object */
  stripPrefix?: boolean;

  /** Behavior when validation fails */
  onError?: OnErrorBehavior;

  /** Exit code when onError is 'exit' */
  exitCode?: number;

  /** Error reporter */
  reporter?: ReporterType | CustomReporter;
}

// ============================================================
// Schema Inference Types
// ============================================================

/** Loosely-typed schema definition for internal use */
export interface AnySchemaDefinition {
  type: SchemaType;
  isOptional: boolean;
  defaultValue?: unknown;
  metadata: SchemaMetadata;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules: ValidationRule<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coerce: (value: string) => CoercionResult<any>;
  enumValues?: readonly string[];
}

/** Base interface that all schemas implement */
export interface AnySchema {
  readonly _output: unknown;
  readonly _optional: boolean;
  readonly _def: AnySchemaDefinition;
  getTypeDescription(): string;
  getExample(): string;
}

/** Extract the output type from a schema */
export type InferSchemaOutput<S extends AnySchema> = S["_optional"] extends true
  ? S["_output"] | undefined
  : S["_output"];

/** Schema record type */
export type EnvSchema = Record<string, AnySchema>;

/** Infer the typed environment object from a schema */
export type InferEnv<T extends EnvSchema> = {
  readonly [K in keyof T]: InferSchemaOutput<T[K]>;
};

// ============================================================
// Generator Types
// ============================================================

/** Options for .env.example generation */
export interface GenerateOptions {
  /** Output file path (default: .env.example) */
  output?: string;

  /** Overwrite existing file */
  force?: boolean;

  /** Include header comment */
  header?: boolean;

  /** Custom header text */
  headerText?: string;
}

// ============================================================
// CLI Types
// ============================================================

/** CLI command names */
export type CliCommand = "check" | "generate" | "help" | "version";

/** CLI options */
export interface CliOptions {
  schema?: string;
  output?: string;
  force?: boolean;
  reporter?: ReporterType;
}

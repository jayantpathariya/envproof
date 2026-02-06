/**
 * EnvProof - TypeScript-first Environment Variable Validation
 *
 * @example
 * ```typescript
 * import { createEnv, e } from 'envproof';
 *
 * const env = createEnv({
 *   DATABASE_URL: e.url().description('PostgreSQL connection string'),
 *   PORT: e.number().port().default(3000),
 *   NODE_ENV: e.enum(['development', 'staging', 'production']),
 *   DEBUG: e.boolean().optional(),
 *   API_KEY: e.string().secret(),
 * });
 *
 * // Fully typed - no more process.env!
 * console.log(env.DATABASE_URL); // URL object
 * console.log(env.PORT);         // number
 * ```
 */

// Main API

/**
 * Create and validate a typed environment object.
 * Validates all environment variables against the provided schema and returns a frozen, fully typed object.
 *
 * @param schema - Schema defining the expected environment variables
 * @param options - Optional configuration for validation behavior
 * @returns Frozen object with validated and typed environment variables
 * @throws {EnvValidationError} If validation fails (unless onError is set to 'exit' or 'return')
 *
 * @example
 * ```typescript
 * const env = createEnv({
 *   PORT: e.number().default(3000),
 *   NODE_ENV: e.enum(['dev', 'prod'] as const),
 * });
 * console.log(env.PORT); // number
 * ```
 */
export { createEnv, validateEnv } from "./create-env.js";

// Schema builders

/**
 * Schema builder namespace containing all validation types.
 * Use `e.*` to create schema definitions for environment variables.
 *
 * @example
 * ```typescript
 * import { e } from 'envproof';
 *
 * const schema = {
 *   API_KEY: e.string().secret(),
 *   PORT: e.number().port(),
 *   DEBUG: e.boolean().optional(),
 * };
 * ```
 */
export * as e from "./schema/index.js";

/**
 * Individual schema builder exports for direct imports.
 * These are the same builders available under the `e` namespace.
 */
export {
  string,
  number,
  boolean,
  enum as enumType,
  url,
  json,
  array,
  duration,
  path,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  EnumSchema,
  UrlSchema,
  JsonSchema,
  ArraySchema,
  DurationSchema,
  PathSchema,
  BaseSchema,
} from "./schema/index.js";

// Generator

/**
 * Generate .env.example file content from a schema.
 *
 * @param schema - Schema to generate example from
 * @param options - Optional generation configuration
 * @returns String content for .env.example file
 *
 * @example
 * ```typescript
 * const content = generateExample(schema);
 * console.log(content);
 * ```
 */
export {
  generateExample,
  generateExampleContent,
  writeExampleFile,
} from "./generator/index.js";

// Validation utilities

/**
 * EnvValidationError is thrown when environment validation fails.
 * Contains structured error information about all validation failures.
 */
export { EnvValidationError, formatErrors } from "./validation/index.js";

// Reporters

/**
 * Format validation errors using different reporters.
 * - formatPretty: Human-readable colored output
 * - formatJson: Machine-readable JSON output
 * - formatMinimal: Single-line summary
 */
export { formatPretty, formatJson, formatMinimal } from "./reporters/index.js";

// Dotenv utilities

/**
 * Load and parse .env files.
 * These utilities can be used independently of createEnv for custom dotenv handling.
 *
 * @example
 * ```typescript
 * import { loadDotenv } from 'envproof';
 *
 * const vars = loadDotenv('.env.local');
 * console.log(vars.DATABASE_URL);
 * ```
 */
export {
  loadDotenv,
  loadDotenvFiles,
  parseDotenv,
  expandDotenvVars,
} from "./dotenv.js";

// Schema composition utilities

/**
 * Schema composition utilities for building complex schemas from simpler ones.
 *
 * @example
 * ```typescript
 * import { mergeSchemas, extendSchema } from 'envproof';
 *
 * const baseSchema = { NODE_ENV: e.enum(['dev', 'prod'] as const) };
 * const serverSchema = { PORT: e.number() };
 * const fullSchema = mergeSchemas(baseSchema, serverSchema);
 * ```
 */
export {
  mergeSchemas,
  extendSchema,
  pickSchema,
  omitSchema,
  prefixSchema,
} from "./compose.js";

// Types

/**
 * TypeScript types for EnvProof.
 * Use InferEnv<T> to extract the type of a validated environment object.
 *
 * @example
 * ```typescript
 * import type { InferEnv } from 'envproof';
 *
 * const schema = { PORT: e.number() };
 * type Env = InferEnv<typeof schema>; // { readonly PORT: number }
 * ```
 */
export type {
  EnvSchema,
  InferEnv,
  EnvOptions,
  ValidationError,
  ValidationResult,
  GenerateOptions,
  AnySchema,
  SchemaType,
  CoercionResult,
  ReporterType,
  CustomReporter,
  CrossFieldValidationIssue,
  CrossFieldValidationResult,
  CrossFieldValidator,
} from "./types.js";

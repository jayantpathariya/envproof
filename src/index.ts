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
export { createEnv, validateEnv } from "./create-env.js";

// Schema builders
export * as e from "./schema/index.js";
export {
  string,
  number,
  boolean,
  enum as enumType,
  url,
  json,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  EnumSchema,
  UrlSchema,
  JsonSchema,
  BaseSchema,
} from "./schema/index.js";

// Generator
export {
  generateExample,
  generateExampleContent,
  writeExampleFile,
} from "./generator/index.js";

// Validation utilities
export { EnvValidationError, formatErrors } from "./validation/index.js";

// Reporters
export { formatPretty, formatJson, formatMinimal } from "./reporters/index.js";

// Types
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
} from "./types.js";

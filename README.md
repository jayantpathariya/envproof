# EnvKit

> TypeScript-first environment variable validation with schema-driven type safety

[![npm version](https://img.shields.io/npm/v/envkit.svg)](https://www.npmjs.com/package/envkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

EnvKit validates environment variables at application startup and fails fast with human-readable errors. No more runtime crashes from missing or invalid configuration.

## Features

- **🔒 Type-safe** - Full TypeScript inference, no `string | undefined`
- **⚡ Fail-fast** - Validation at startup, not runtime
- **📝 Self-documenting** - Schema is the single source of truth
- **🎯 Explicit coercion** - Clear rules for string → number/boolean/etc
- **🔐 Secret masking** - Automatic redaction in error output
- **📄 .env.example generation** - Auto-generate documentation
- **🚀 Zero dependencies** - Lightweight and fast
- **🌐 Framework-agnostic** - Works everywhere Node.js runs

## Installation

```bash
npm install envkit
# or
pnpm add envkit
# or
bun add envkit
```

## Quick Start

```typescript
import { createEnv, e } from "envkit";

// Define your schema (single source of truth)
const env = createEnv({
  DATABASE_URL: e.url().description("PostgreSQL connection string"),
  PORT: e.number().port().default(3000),
  NODE_ENV: e.enum(["development", "staging", "production"] as const),
  DEBUG: e.boolean().optional(),
  API_KEY: e.string().secret(),
});

// env is fully typed!
console.log(env.DATABASE_URL); // URL object
console.log(env.PORT); // number (3000 if not set)
console.log(env.NODE_ENV); // 'development' | 'staging' | 'production'
console.log(env.DEBUG); // boolean | undefined
console.log(env.API_KEY); // string
```

## Schema Types

### String

```typescript
e.string()
  .minLength(1) // Minimum length
  .maxLength(255) // Maximum length
  .pattern(/^[A-Z]+$/) // Regex validation
  .email() // Email format
  .uuid() // UUID format
  .nonEmpty() // Must not be empty/whitespace
  .startsWith("sk_") // Must start with prefix
  .endsWith(".json") // Must end with suffix
  .secret() // Mask in error output
  .optional() // Allow undefined
  .default("fallback") // Default value
  .description("...") // Documentation
  .example("example_value"); // Example for .env.example
```

### Number

```typescript
e.number()
  .min(0) // Minimum value
  .max(100) // Maximum value
  .integer() // Must be integer
  .positive() // Must be > 0
  .nonNegative() // Must be >= 0
  .port() // Valid port (1-65535)
  .between(1, 10); // Range shorthand
```

### Boolean

Accepts: `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` (case-insensitive)

```typescript
e.boolean().optional().default(false);
```

### Enum

```typescript
e.enum(["development", "staging", "production"] as const).default(
  "development"
);
```

> **Note:** Use `as const` for proper type inference.

### URL

Returns a native `URL` object for easy manipulation.

```typescript
e.url()
  .protocols(["http", "https"]) // Restrict protocols
  .http() // Shorthand for http/https
  .withPath() // Require a path
  .host("api.example.com"); // Require specific host
```

### JSON

Parse and validate JSON configuration.

```typescript
e.json<{ host: string; port: number }>()
  .object() // Must be an object
  .array() // Must be an array
  .validate((v) => v.port > 0, "Port must be positive");
```

## Configuration Options

```typescript
const env = createEnv(schema, {
  // Custom source (default: process.env)
  source: process.env,

  // Prefix filtering
  prefix: "APP_", // Only read APP_* variables
  stripPrefix: true, // APP_PORT -> PORT in output

  // Error handling
  onError: "throw", // 'throw' | 'exit' | 'return'
  exitCode: 1, // Exit code when onError: 'exit'

  // Output format
  reporter: "pretty", // 'pretty' | 'json' | 'minimal'
});
```

## Error Output

When validation fails, EnvKit provides clear, actionable error messages:

```
╭─────────────────────────────────────────────────────────────────╮
│                    ❌ Environment Validation Failed              │
│                         3 errors found                           │
╰─────────────────────────────────────────────────────────────────╯

┌─ MISSING VARIABLES ─────────────────────────────────────────────┐
│                                                                  │
│  DATABASE_URL                                                    │
│    ├─ Status:   Missing (required)                               │
│    ├─ Expected: URL (PostgreSQL connection string)               │
│    └─ Example:  postgresql://user:pass@localhost:5432/db         │
│                                                                  │
│  API_KEY                                                         │
│    ├─ Status:   Missing (required)                               │
│    ├─ Expected: string (secret)                                  │
│    └─ Example:  sk_***                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ INVALID VALUES ────────────────────────────────────────────────┐
│                                                                  │
│  PORT                                                            │
│    ├─ Status:   Invalid type                                     │
│    ├─ Expected: number (integer, 1-65535)                        │
│    ├─ Received: "not-a-number"                                   │
│    └─ Example:  3000                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

💡 Tip: Run `npx envkit generate` to create a .env.example file
```

### JSON Reporter (for CI)

```typescript
const env = createEnv(schema, { reporter: "json" });
```

```json
{
  "success": false,
  "errorCount": 3,
  "errors": [
    {
      "variable": "DATABASE_URL",
      "reason": "missing",
      "message": "Required variable is not set",
      "expected": "URL",
      "isSecret": false
    }
  ]
}
```

## .env.example Generation

### Programmatic

```typescript
import { generateExample } from "envkit";

const content = generateExample(schema);
console.log(content);
```

### CLI

```bash
npx envkit generate
npx envkit generate --output .env.template
npx envkit generate --force  # Overwrite existing
```

### Example Output

```bash
# ============================================================
# Environment Configuration
# Generated by envkit
# ============================================================

# PostgreSQL connection string
# Required: yes
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Server port
# Required: no (default: 3000)
# PORT=3000

# Application environment
# Required: yes
# Options: development | staging | production
NODE_ENV=development

# Enable debug logging
# Required: no
# DEBUG=true

# External API key
# Required: yes
# ⚠️  This is a secret - do not commit real values
API_KEY=your_secret_here
```

## CLI Commands

```bash
# Validate environment against schema
npx envkit check
npx envkit check --schema ./config/env.ts
npx envkit check --reporter json

# Generate .env.example
npx envkit generate
npx envkit generate --output .env.example
npx envkit generate --force
```

## Best Practices

### 1. Single Schema File

Create a dedicated file for your env schema:

```typescript
// src/env.ts
import { createEnv, e } from "envkit";

export const env = createEnv({
  // ... your schema
});
```

Import it everywhere:

```typescript
import { env } from "./env";
console.log(env.DATABASE_URL);
```

### 2. Never Use process.env Directly

After setting up EnvKit, use only the typed `env` object:

```typescript
// ❌ Bad
const port = process.env.PORT;

// ✅ Good
const port = env.PORT;
```

### 3. Mark Sensitive Variables

Always mark secrets to prevent accidental logging:

```typescript
API_KEY: e.string().secret(),
DATABASE_URL: e.url().secret(),
```

### 4. Document Everything

Add descriptions for .env.example generation:

```typescript
PORT: e.number()
  .port()
  .default(3000)
  .description('HTTP server port')
  .example('8080'),
```

## Framework Examples

### Express

```typescript
// src/env.ts
import { createEnv, e } from "envkit";

export const env = createEnv({
  PORT: e.number().port().default(3000),
  NODE_ENV: e.enum(["development", "production"] as const),
});

// src/index.ts
import express from "express";
import { env } from "./env";

const app = express();
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
```

### Next.js

```typescript
// env.config.ts
import { createEnv, e } from "envkit";

export const env = createEnv({
  DATABASE_URL: e.url(),
  NEXTAUTH_SECRET: e.string().secret(),
  NEXTAUTH_URL: e.url().optional(),
});
```

### Serverless (AWS Lambda)

```typescript
import { createEnv, e } from "envkit";

const env = createEnv({
  TABLE_NAME: e.string(),
  AWS_REGION: e.string().default("us-east-1"),
});

export const handler = async (event) => {
  // env is validated before handler runs
  const tableName = env.TABLE_NAME;
};
```

## TypeScript

EnvKit provides full type inference:

```typescript
const env = createEnv({
  PORT: e.number().default(3000),
  DEBUG: e.boolean().optional(),
  NODE_ENV: e.enum(["dev", "prod"] as const),
});

// Types are inferred:
// env.PORT    -> number
// env.DEBUG   -> boolean | undefined
// env.NODE_ENV -> 'dev' | 'prod'
```

### Type Extraction

```typescript
import type { InferEnv } from "envkit";

const schema = {
  PORT: e.number(),
};

type Env = InferEnv<typeof schema>;
// { readonly PORT: number }
```

## API Reference

### `createEnv(schema, options?)`

Main function to validate and create typed env object.

- **schema**: Record of variable names to schema definitions
- **options**: Configuration options (optional)
- **returns**: Frozen object with validated values
- **throws**: `EnvValidationError` if validation fails

### `validateEnv(schema, options?)`

Validate without throwing - returns result object.

```typescript
const result = validateEnv(schema);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.errors);
}
```

### `generateExample(schema, options?)`

Generate .env.example content as string.

### `writeExampleFile(schema, options?)`

Write .env.example file to disk.

### `e.*` Schema Builders

- `e.string()` - String values
- `e.number()` - Numeric values
- `e.boolean()` - Boolean values
- `e.enum([...])` - Enumerated values
- `e.url()` - URL values
- `e.json<T>()` - JSON values

## License

MIT © EnvKit Contributors

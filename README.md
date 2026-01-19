# EnvProof

> TypeScript-first environment variable validation with schema-driven type safety

[![npm version](https://img.shields.io/npm/v/envproof.svg)](https://www.npmjs.com/package/envproof)
[![CI](https://github.com/jayantpathariya/envproof/actions/workflows/ci.yml/badge.svg)](https://github.com/jayantpathariya/envproof/actions/workflows/ci.yml)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/envproof)](https://bundlephobia.com/package/envproof)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

EnvProof validates environment variables at application startup and fails fast with human-readable errors. No more runtime crashes from missing or invalid configuration.

## Features

- **🔒 Type-safe** - Full TypeScript inference, no `string | undefined`
- **⚡ Fail-fast** - Validation at startup, not runtime
- **📝 Self-documenting** - Schema is the single source of truth
- **🎯 Explicit coercion** - Clear rules for string → number/boolean/etc
- **🔐 Secret masking** - Automatic redaction in error output
- **📄 .env.example generation** - Auto-generate documentation
- **🚀 Zero dependencies** - Lightweight and fast
- **🌐 Framework-agnostic** - Works everywhere Node.js runs

## Why EnvProof?

| Feature                 | EnvProof |  Zod  | t3-env | envalid |
| ----------------------- | :------: | :---: | :----: | :-----: |
| Zero dependencies       |    ✅    |  ❌   |   ❌   |   ❌    |
| Built-in CLI            |    ✅    |  ❌   |   ❌   |   ✅    |
| .env.example generation |    ✅    |  ❌   |   ❌   |   ❌    |
| Bundle size             |   ~5KB   | ~60KB | ~65KB  |  ~15KB  |
| First-class env focus   |    ✅    |  ❌   |   ✅   |   ✅    |
| Type inference          |    ✅    |  ✅   |   ✅   |   ⚠️    |
| Human-readable errors   |    ✅    |  ⚠️   |   ⚠️   |   ✅    |

## Installation

```bash
npm install envproof
# or
pnpm add envproof
# or
bun add envproof
```

## Quick Start

```typescript
import { createEnv, e } from "envproof";

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
  .length(10) // Exact length
  .pattern(/^[A-Z]+$/) // Regex validation
  .email() // Email format
  .uuid() // UUID format
  .nonEmpty() // Must not be empty/whitespace
  .startsWith("sk_") // Must start with prefix
  .endsWith(".json") // Must end with suffix
  .ip() // IP address (IPv4 or IPv6)
  .ip({ version: "v4" }) // IPv4 only
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

### Array

Parse comma-separated values into arrays.

```typescript
e.array(e.string()); // "a,b,c" -> ["a", "b", "c"]
e.array(e.number()).separator(";"); // "1;2;3" -> [1, 2, 3]
e.array(e.string().email())
  .minLength(1) // Minimum array length
  .maxLength(10); // Maximum array length
```

### Duration

Parse human-readable duration strings into milliseconds.

```typescript
e.duration(); // "10m" -> 600000
e.duration().default("24h"); // Default: 86400000 (string supported!)
e.duration().default(5000); // Or use milliseconds directly
e.duration().min("1s").max("1h"); // "30s" -> 30000
```

Supports: `ms`, `s`, `m`, `h`, `d`, `w` (and long forms like `seconds`).

### Path

Validate file system paths.

```typescript
e.path()
  .exists() // Must exist on disk
  .isFile() // Must be a file
  .isDirectory() // Must be a directory
  .absolute() // Must be absolute path
  .extension(".json") // specific extension
  .readable() // Must be readable
  .writable(); // Must be writable
```

### IP Address

Validate IP addresses.

```typescript
e.string().ip(); // IPv4 or IPv6
e.string().ip({ version: "v4" }); // IPv4 only
e.string().ip({ version: "v6" }); // IPv6 only
```

## Advanced Examples

Check out the `/examples` folder for complete working examples:

- **[basic.ts](examples/basic.ts)** - Simple usage
- **[express.ts](examples/express.ts)** - Express.js integration  
- **[nextjs.ts](examples/nextjs.ts)** - Next.js configuration
- **[docker.ts](examples/docker.ts)** - Docker/container environments
- **[monorepo.ts](examples/monorepo.ts)** - Monorepo shared configuration

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

  // Dotenv Loading (New in v1.1.0)
  dotenv: true, // Load .env file automatically
  dotenvPath: ".env.local", // Custom path

  // Multi-Environment (New in v1.1.0)
  environment: process.env.NODE_ENV, // Current environment
  requireInProduction: ["API_KEY"], // Make optional vars required in prod
  optionalInDevelopment: ["SENTRY_DSN"], // Make required vars optional in dev
});
```

### Transforms & Custom Validators

Chain transformations and custom rules:

```typescript
e.string()
  .transform((s) => s.trim()) // Trim whitespace
  .transform((s) => s.toLowerCase()) // Lowercase
  .custom((val) => val.startsWith("sk_"), "Must start with sk_"); // Custom rule
```

## Error Output

When validation fails, EnvProof provides clear, actionable error messages:

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

💡 Tip: Run `npx envproof generate` to create a .env.example file
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
import { generateExample } from "envproof";

const content = generateExample(schema);
console.log(content);
```

### CLI

```bash
npx envproof generate
npx envproof generate --output .env.template
npx envproof generate --force  # Overwrite existing
```

### Example Output

```bash
# ============================================================
# Environment Configuration
# Generated by envproof
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
npx envproof check
npx envproof check --schema ./config/env.ts
npx envproof check --reporter json

# Generate .env.example
npx envproof generate
npx envproof generate --output .env.example
npx envproof generate --force
```

## Best Practices

### 1. Single Schema File

Create a dedicated file for your env schema:

```typescript
// src/env.ts
import { createEnv, e } from "envproof";

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

After setting up EnvProof, use only the typed `env` object:

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
import { createEnv, e } from "envproof";

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
import { createEnv, e } from "envproof";

export const env = createEnv({
  DATABASE_URL: e.url(),
  NEXTAUTH_SECRET: e.string().secret(),
  NEXTAUTH_URL: e.url().optional(),
});
```

### Serverless (AWS Lambda)

```typescript
import { createEnv, e } from "envproof";

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

EnvProof provides full type inference:

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
import type { InferEnv } from "envproof";

const schema = {
  PORT: e.number(),
};

type Env = InferEnv<typeof schema>;
// { readonly PORT: number }
```

## Dotenv Utilities

EnvProof exports standalone dotenv utilities for advanced use cases:

```typescript
import { loadDotenv, loadDotenvFiles, parseDotenv } from "envproof";

// Load .env file (similar to dotenv)
loadDotenv(); // Loads .env by default
loadDotenv(".env.local"); // Custom path

// Load multiple .env files with priority
loadDotenvFiles([".env.local", ".env"]); // .env.local takes precedence

// Parse .env file content
const envContent = `
DATABASE_URL=postgresql://localhost:5432/db
PORT=3000
`;
const parsed = parseDotenv(envContent);
console.log(parsed); // { DATABASE_URL: '...', PORT: '3000' }
```

These utilities can be used independently of `createEnv()` if you need custom dotenv loading logic.

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
- `e.array(itemSchema)` - Array values (comma-separated)
- `e.duration()` - Duration values (e.g., "1h", "30m")
- `e.path()` - File system paths

### Dotenv Utilities

- `loadDotenv(path?)` - Load .env file into process.env
- `loadDotenvFiles(paths)` - Load multiple .env files with priority
- `parseDotenv(content)` - Parse .env file content to object

## License

MIT © EnvProof Contributors

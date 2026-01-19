# Troubleshooting Guide

Common issues and their solutions when using EnvProof.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Validation Errors](#validation-errors)
- [Type Inference Issues](#type-inference-issues)
- [Runtime Issues](#runtime-issues)
- [CLI Issues](#cli-issues)
- [Performance Issues](#performance-issues)

---

## Installation Issues

### Package Not Found

**Problem**: `Cannot find package 'envproof'`

**Solution**:
```bash
# Clear npm cache
pnpm store prune

# Reinstall
pnpm add envproof

# Or use specific version
pnpm add envproof@latest
```

### TypeScript Errors After Installation

**Problem**: TypeScript can't find types

**Solution**:
```bash
# Ensure you have TypeScript installed
pnpm add -D typescript

# Check tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler", // or "node16"
    "esModuleInterop": true
  }
}
```

---

## Validation Errors

### "Cannot read from process.env"

**Problem**: EnvProof can't access environment variables

**Solution**:
```typescript
// Option 1: Load .env file first
import { createEnv, e, loadDotenv } from "envproof";
loadDotenv();

// Option 2: Use dotenv option
const env = createEnv({
  PORT: e.number().default(3000),
}, {
  dotenv: true, // Automatically load .env
});

// Option 3: Use custom source
const env = createEnv({
  PORT: e.number().default(3000),
}, {
  source: myCustomEnvObject,
});
```

### Numbers Not Parsing

**Problem**: `Expected number, received "3000"`

**Cause**: EnvProof requires valid number strings

**Solution**:
```typescript
// ❌ Invalid - contains spaces or letters
PORT=3000 abc

// ✅ Valid
PORT=3000

// Check for whitespace
const env = createEnv({
  PORT: e.number().transform(n => Math.floor(n)),
});
```

### Boolean Confusion

**Problem**: `"false" is being parsed as true`

**Explanation**: In environment variables, only these are recognized:

| True Values | False Values |
|-------------|--------------|
| `true`      | `false`      |
| `1`         | `0`          |
| `yes`       | `no`         |
| `on`        | `off`        |

**Solution**:
```bash
# ❌ Won't work
DEBUG=False  # Capital F
DEBUG=FALSE
DEBUG=f

# ✅ Will work (case-insensitive)
DEBUG=false
DEBUG=False  # Actually works, envproof is case-insensitive
DEBUG=0
DEBUG=no
```

### URL Validation Failing

**Problem**: Valid-looking URLs fail validation

**Common Issues**:
```typescript
// Issue: Missing protocol
DATABASE_URL=localhost:5432  // ❌ Fails
DATABASE_URL=postgresql://localhost:5432  // ✅ Works

// Issue: Invalid protocol
API_URL=ftp://example.com  // ❌ Might fail with .http()

const env = createEnv({
  API_URL: e.url().protocols(["http", "https", "ftp"]), // ✅ Allow FTP
});

// Issue: URL encoding
API_URL=https://example.com/path with spaces  // ❌
API_URL=https://example.com/path%20with%20spaces  // ✅
```

### Enum Values Not Matching

**Problem**: `Expected "development" | "staging" | "production", received "dev"`

**Solution**:
```typescript
// Option 1: Update .env file
NODE_ENV=development  // Not "dev"

// Option 2: Add all variations to enum
NODE_ENV: e.enum(["dev", "development", "prod", "production"] as const)

// Option 3: Use transform
NODE_ENV: e
  .enum(["development", "production"] as const)
  .transform(env => env === "dev" ? "development" : env)
```

---

## Type Inference Issues

### Type is `any` Instead of Specific Type

**Problem**: TypeScript shows `env.PORT: any`

**Cause**: Missing `as const` on enums or incorrect import

**Solution**:
```typescript
// ❌ Wrong - array is mutable
NODE_ENV: e.enum(["development", "production"])

// ✅ Correct - use as const
NODE_ENV: e.enum(["development", "production"] as const)

// Also check imports
import { createEnv, e } from "envproof"; // ✅ Correct
import * as envproof from "envproof"; // ⚠️  Might cause issues
```

### Optional Types Not Working

**Problem**: TypeScript error: `Property 'DEBUG' is possibly 'undefined'`

**Explanation**: This is correct! Optional values can be undefined.

**Solution**:
```typescript
const env = createEnv({
  DEBUG: e.boolean().optional(),
});

// Option 1: Optional chaining
if (env.DEBUG) {
  console.log("Debug mode enabled");
}

// Option 2: Nullish coalescing
const debug = env.DEBUG ?? false;

// Option 3: Use default instead of optional
DEBUG: e.boolean().default(false), // Now it's always defined
```

### Cannot Modify `env` Object

**Problem**: `Cannot assign to read only property`

**Explanation**: This is intentional! `env` is frozen to prevent accidental modifications.

**Solution**:
```typescript
const env = createEnv({ PORT: e.number() });

// ❌ Can't modify
env.PORT = 4000; // Error!

// ✅ If you need different values, create new env
const testEnv = createEnv(schema, {
  source: { PORT: "4000" }
});
```

---

## Runtime Issues

### Application Exits Immediately

**Problem**: App crashes at startup with env validation errors

**Explanation**: This is intentional (fail-fast pattern)

**Solutions**:
```typescript
// Option 1: Fix the actual env variables (recommended)

// Option 2: Change error behavior in development
const env = createEnv(schema, {
  onError: process.env.NODE_ENV === "production" ? "exit" : "throw",
});

// Option 3: Use validateEnv for custom handling
import { validateEnv } from "envproof";

const result = validateEnv(schema);
if (!result.success) {
  console.error("Config errors:", result.errors);
  // Custom recovery logic
}
```

### Secrets Visible in Logs

**Problem**: API keys showing in error messages

**Solution**:
```typescript
// Mark sensitive variables as secrets
const env = createEnv({
  API_KEY: e.string().secret(), // ✅ Will be masked as ***
  DATABASE_URL: e.url().secret(), // ✅ Masked
  PASSWORD: e.string().secret(), // ✅ Masked
});

// Verify masking
try {
  createEnv({ KEY: e.string().secret() }, { source: {} });
} catch (error) {
  console.error(error); // Shows "***" not actual value
}
```

### Circular Dependency Errors

**Problem**: `ReferenceError: Cannot access 'env' before initialization`

**Solution**:
```typescript
// ❌ Wrong - circular dependency
// env.ts
import { db } from "./db";
export const env = createEnv({ /* ... */ });

// db.ts
import { env } from "./env"; // Circular!
export const db = createDB(env.DATABASE_URL);

// ✅ Correct - pass env as parameter
// env.ts
export const env = createEnv({ /* ... */ });

// db.ts
export function createDB(url: string) { /* ... */ }

// main.ts
import { env } from "./env";
import { createDB } from "./db";
const db = createDB(env.DATABASE_URL);
```

---

## CLI Issues

### `envproof` Command Not Found

**Problem**: Running `npx envproof check` fails

**Solutions**:
```bash
# Option 1: Use full npx path
npx envproof check

# Option 2: Install globally
pnpm add -g envproof
envproof check

# Option 3: Use package.json scripts
# package.json
{
  "scripts": {
    "validate-env": "envproof check"
  }
}
pnpm run validate-env
```

### CLI Can't Find Schema File

**Problem**: `Could not find environment schema`

**Solution**:
```bash
# Specify schema file explicitly
npx envproof check --schema ./src/config/env.ts

# Or use default location (src/env.ts or env.ts)
# Move your schema to one of these locations
```

### Generate Command Not Creating File

**Problem**: `.env.example` not being created

**Solutions**:
```bash
# Check permissions
ls -la .env.example

# Force overwrite
npx envproof generate --force

# Specify output path
npx envproof generate --output .env.template

# Check schema has examples
const env = createEnv({
  PORT: e.number().example("3000"), // Add examples!
});
```

---

## Performance Issues

### Slow Application Startup

**Problem**: Validation takes too long

**Diagnostics**:
```typescript
console.time("env-validation");
const env = createEnv(schema);
console.timeEnd("env-validation");
// Should be < 10ms for typical schemas
```

**Solutions**:
```typescript
// 1. Remove expensive custom validators
// ❌ Slow - network call
API_KEY: e.string().custom(async (key) => {
  const valid = await validateKeyWithAPI(key);
  return valid;
}, "Invalid API key")

// ✅ Fast - simple validation
API_KEY: e.string().minLength(20).startsWith("sk_")

// 2. Reduce path validation
// ❌ Slow - filesystem checks
CONFIG_PATH: e.path().exists().isFile().readable()

// ✅ Fast - only when needed
CONFIG_PATH: e.path() // Validate existence later when actually reading

// 3. Simplify JSON schemas
// ❌ Slow - large JSON parsing
CONFIG: e.json().validate(val => complexValidation(val))

// ✅ Fast - simple type check
CONFIG: e.json().object()
```

### High Memory Usage

**Problem**: Multiple env objects consuming memory

**Solution**:
```typescript
// ❌ Creating multiple instances
export function getEnv() {
  return createEnv(schema); // New object each call!
}

// ✅ Singleton pattern
let _env: ReturnType<typeof createEnv> | null = null;

export function getEnv() {
  if (!_env) {
    _env = createEnv(schema);
  }
  return _env;
}

// ✅ Or just export directly
export const env = createEnv(schema);
```

---

## Advanced Debugging

### Enable Verbose Logging

```typescript
const env = createEnv(schema, {
  reporter: "pretty", // Shows detailed errors
  onError: "throw",   // Get full stack traces
});
```

### Inspect Schema Definition

```typescript
const schema = {
  PORT: e.number().port(),
};

// Access internal definition
console.log(schema.PORT._def);
// {
//   type: 'number',
//   isOptional: false,
//   rules: [...],
//   coerce: [Function],
//   metadata: { ... }
// }
```

### Test Validation in Isolation

```typescript
import { validateEnv } from "envproof";

describe("Environment config", () => {
  it("should validate production config", () => {
    const result = validateEnv(schema, {
      source: {
        DATABASE_URL: "postgresql://...",
        NODE_ENV: "production",
      },
    });

    expect(result.success).toBe(true);
  });
});
```

---

## Getting More Help

If your issue isn't covered here:

1. **Check Examples**: Look at the [examples folder](./examples)
2. **Search Issues**: Check [GitHub Issues](https://github.com/jayantpathariya/envproof/issues)
3. **Ask Questions**: Start a [Discussion](https://github.com/jayantpathariya/envproof/discussions)
4. **Report Bugs**: Create a [Bug Report](https://github.com/jayantpathariya/envproof/issues/new?template=bug_report.md)

### Creating a Good Bug Report

```typescript
// Include a minimal reproduction
import { createEnv, e } from "envproof";

// Schema that causes the issue
const env = createEnv({
  PROBLEM_VAR: e.string().minLength(5),
});

// Environment that triggers the bug
// process.env.PROBLEM_VAR = "test"

// Expected behavior: Should fail validation
// Actual behavior: ...
```

Include:
- EnvProof version (`pnpm list envproof`)
- Node.js version (`node --version`)
- Operating system
- Full error message
- Minimal code to reproduce

---

**Last Updated**: January 19, 2026

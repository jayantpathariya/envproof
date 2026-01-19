# Migration Guide

This guide helps you migrate to EnvProof from other environment validation libraries.

## Table of Contents

- [From Zod](#from-zod)
- [From t3-env](#from-t3-env)
- [From envalid](#from-envalid)
- [From dotenv-safe](#from-dotenv-safe)
- [From joi](#from-joi)

---

## From Zod

### Before (Zod)

```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "staging", "production"]),
  DEBUG: z.boolean().optional(),
  API_KEY: z.string().min(10),
});

const env = envSchema.parse(process.env);
```

### After (EnvProof)

```typescript
import { createEnv, e } from "envproof";

const env = createEnv({
  DATABASE_URL: e.url(),
  PORT: e.number().integer().positive().default(3000),
  NODE_ENV: e.enum(["development", "staging", "production"] as const),
  DEBUG: e.boolean().optional(),
  API_KEY: e.string().minLength(10).secret(),
});
```

### Key Differences

| Feature              | Zod                      | EnvProof                    |
| -------------------- | ------------------------ | --------------------------- |
| **Coercion**         | `z.coerce.number()`      | `e.number()` (automatic)    |
| **Secret masking**   | Manual                   | `.secret()` built-in        |
| **Default values**   | `.default()`             | `.default()` (same)         |
| **Bundle size**      | ~60KB                    | ~5KB                        |
| **Error messages**   | Generic                  | Environment-specific        |
| **CLI**              | No                       | Yes (`envproof check`)      |
| **.env.example**     | No                       | Yes (`envproof generate`)   |

### Migration Steps

1. **Install EnvProof**
   ```bash
   pnpm remove zod
   pnpm add envproof
   ```

2. **Update imports**
   ```diff
   - import { z } from "zod";
   + import { createEnv, e } from "envproof";
   ```

3. **Convert schema**
   - Replace `z.object({})` with `createEnv({})`
   - Replace `z.string()` with `e.string()`
   - Replace `z.coerce.number()` with `e.number()`
   - Add `.secret()` to sensitive values
   - Add `as const` to enums for proper type inference

4. **Remove `process.env` coercion**
   - EnvProof reads from `process.env` automatically
   - Remove `.parse(process.env)`

---

## From t3-env

### Before (t3-env)

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    OPEN_AI_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  },
});
```

### After (EnvProof)

```typescript
import { createEnv, e } from "envproof";

// Server-only environment variables
export const env = createEnv({
  DATABASE_URL: e.url(),
  OPEN_AI_API_KEY: e.string().nonEmpty().secret(),
});

// Client-safe environment variables
export const publicEnv = createEnv({
  NEXT_PUBLIC_PUBLISHABLE_KEY: e.string().nonEmpty(),
}, {
  prefix: "NEXT_PUBLIC_",
  stripPrefix: false,
});
```

### Key Differences

| Feature                | t3-env                     | EnvProof                     |
| ---------------------- | -------------------------- | ---------------------------- |
| **Server/Client split**| Built-in                   | Use separate calls           |
| **Prefix filtering**   | Manual via `runtimeEnv`    | `prefix` option              |
| **Type inference**     | Yes                        | Yes                          |
| **Bundle size**        | ~65KB (includes Zod)       | ~5KB                         |
| **Framework agnostic** | No (Next.js focused)       | Yes                          |

---

## From envalid

### Before (envalid)

```typescript
import { cleanEnv, str, num, bool, url } from "envalid";

const env = cleanEnv(process.env, {
  DATABASE_URL: url(),
  PORT: num({ default: 3000 }),
  NODE_ENV: str({ choices: ["development", "staging", "production"] }),
  DEBUG: bool({ default: false }),
  API_KEY: str(),
});
```

### After (EnvProof)

```typescript
import { createEnv, e } from "envproof";

const env = createEnv({
  DATABASE_URL: e.url(),
  PORT: e.number().default(3000),
  NODE_ENV: e.enum(["development", "staging", "production"] as const),
  DEBUG: e.boolean().default(false),
  API_KEY: e.string().secret(),
});
```

### Migration Mapping

| envalid              | EnvProof                     |
| -------------------- | ---------------------------- |
| `str()`              | `e.string()`                 |
| `num()`              | `e.number()`                 |
| `bool()`             | `e.boolean()`                |
| `url()`              | `e.url()`                    |
| `json()`             | `e.json()`                   |
| `str({ choices })`   | `e.enum([...] as const)`     |
| `{ default: ... }`   | `.default(...)`              |
| `{ devDefault: ... }`| Use `optionalInDevelopment`  |

---

## From dotenv-safe

### Before (dotenv-safe)

```javascript
require("dotenv-safe").config({
  allowEmptyValues: false,
  example: ".env.example",
});

// No type safety!
const port = parseInt(process.env.PORT || "3000");
```

### After (EnvProof)

```typescript
import { createEnv, e } from "envproof";

const env = createEnv({
  PORT: e.number().port().default(3000),
  DATABASE_URL: e.url(),
  API_KEY: e.string().secret(),
}, {
  dotenv: true, // Load .env automatically
});

// Fully typed!
const port = env.PORT; // number
```

### Benefits

- ✅ **Type safety**: Full TypeScript inference
- ✅ **Validation**: Not just presence checks
- ✅ **Better errors**: Human-readable messages
- ✅ **Auto-generate**: Create `.env.example` from schema

---

## From joi

### Before (joi)

```javascript
const Joi = require("joi");

const schema = Joi.object({
  DATABASE_URL: Joi.string().uri().required(),
  PORT: Joi.number().port().default(3000),
  NODE_ENV: Joi.string().valid("development", "staging", "production"),
  DEBUG: Joi.boolean().optional(),
});

const { error, value: env } = schema.validate(process.env, {
  allowUnknown: true,
  abortEarly: false,
});

if (error) {
  console.error(error.details);
  process.exit(1);
}
```

### After (EnvProof)

```typescript
import { createEnv, e } from "envproof";

const env = createEnv({
  DATABASE_URL: e.url(),
  PORT: e.number().port().default(3000),
  NODE_ENV: e.enum(["development", "staging", "production"] as const),
  DEBUG: e.boolean().optional(),
});
```

### Migration Mapping

| joi                        | EnvProof                     |
| -------------------------- | ---------------------------- |
| `Joi.string()`             | `e.string()`                 |
| `Joi.number()`             | `e.number()`                 |
| `Joi.boolean()`            | `e.boolean()`                |
| `Joi.string().uri()`       | `e.url()`                    |
| `Joi.string().valid(...)`  | `e.enum([...] as const)`     |
| `.default(...)`            | `.default(...)`              |
| `.optional()`              | `.optional()`                |
| `.required()`              | Default behavior             |

---

## General Migration Tips

### 1. Start Small

Migrate one service/module at a time:

```typescript
// 1. Install EnvProof alongside existing solution
pnpm add envproof

// 2. Create new env file
// src/env.new.ts
import { createEnv, e } from "envproof";
export const env = createEnv({ /* ... */ });

// 3. Gradually replace imports
- import { env } from "./env.old";
+ import { env } from "./env.new";

// 4. Remove old solution when done
```

### 2. Use Type Extraction

If you need the env type elsewhere:

```typescript
import type { InferEnv } from "envproof";

const schema = {
  PORT: e.number(),
  HOST: e.string(),
};

export type Env = InferEnv<typeof schema>;
// { readonly PORT: number; readonly HOST: string }
```

### 3. Test Thoroughly

```typescript
// tests/env.test.ts
import { validateEnv, e } from "envproof";

describe("Environment validation", () => {
  it("should accept valid config", () => {
    const result = validateEnv({
      PORT: e.number().default(3000),
    }, {
      source: { PORT: "8080" },
    });

    expect(result.success).toBe(true);
    expect(result.data?.PORT).toBe(8080);
  });
});
```

### 4. Update CI/CD

Add validation to your CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate environment schema
  run: npx envproof check
```

### 5. Generate Documentation

Create `.env.example` automatically:

```bash
npx envproof generate
git add .env.example
git commit -m "docs: add generated .env.example"
```

---

## Common Patterns

### Monorepo with Shared Config

```typescript
// packages/config/env.ts
import { e } from "envproof";

export const sharedSchema = {
  NODE_ENV: e.enum(["development", "staging", "production"] as const),
  LOG_LEVEL: e.string().default("info"),
};

// apps/api/env.ts
import { createEnv } from "envproof";
import { sharedSchema } from "@repo/config/env";

export const env = createEnv({
  ...sharedSchema,
  DATABASE_URL: e.url(),
  PORT: e.number().port().default(3000),
});
```

### Multi-Environment Support

```typescript
const env = createEnv({
  DATABASE_URL: e.url(),
  SENTRY_DSN: e.url().optional(), // Optional in dev, required in prod
  DEBUG: e.boolean().optional(),
}, {
  environment: process.env.NODE_ENV,
  requireInProduction: ["SENTRY_DSN"],
  optionalInDevelopment: ["DATABASE_URL"],
});
```

### Custom Validation

```typescript
const env = createEnv({
  API_KEY: e
    .string()
    .minLength(20)
    .startsWith("sk_")
    .custom(
      (val) => val.split("_")[1]?.length === 32,
      "API key must have 32-character identifier"
    )
    .secret(),
});
```

---

## Need Help?

- 📚 [Full Documentation](https://github.com/jayantpathariya/envproof#readme)
- 💬 [GitHub Discussions](https://github.com/jayantpathariya/envproof/discussions)
- 🐛 [Report Issues](https://github.com/jayantpathariya/envproof/issues)

**Still stuck?** Open a [discussion](https://github.com/jayantpathariya/envproof/discussions) and we'll help you migrate!

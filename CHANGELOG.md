# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-02-06

### Added

- **CLI `init` command**: `envproof init` now scaffolds `env.config.ts` and `.env.example`
- **Strict mode**: Added `strict` and `strictIgnore` options to fail on unknown variables
- **Cross-field validation**: Added `crossValidate` option for schema-level rules across multiple vars
- **Layered dotenv loading**: `dotenvPath` now supports `string[]` for loading multiple files in order
- **Dotenv variable expansion**: Added `expandDotenvVars()` utility and `dotenvExpand` option
- **CLI argument parser module**: Added dedicated parser with support for `--strict`
- **CI smoke tests for built CLI**: Added `dist` CLI smoke tests and matrix alignment for Node 18/20/22

### Fixed

- **CLI version output**: `envproof version` now reads package version dynamically instead of a stale constant
- **Schema loader refactor**: Consolidated duplicated schema-loading logic into shared CLI module
- **Windows-safe module URL conversion**: Switched schema loading to `pathToFileURL`
- **`onError: "return"` semantics**: `createEnv` now returns a `ValidationResult` instead of throwing
- **README dotenv API docs**: Corrected `loadDotenvFiles` usage and clarified return semantics

### Changed

- **Validation error reasons**: Added `unknown` and `cross_field` error categories
- **Pretty reporter output**: Added sections for unknown vars and cross-field rule failures
- **CLI tests**: Replaced placeholder tests with real checks for force/output/reporter/options
- **Test suite**: Increased from 247 to 264 tests

## [1.3.0] - 2026-01-26

### Added

- **Schema Composition Utilities**: New functions for composing and reusing schemas
  - `mergeSchemas(...schemas)` - Merge multiple schemas into one
  - `extendSchema(base, extension)` - Extend a base schema with additional fields
  - `pickSchema(schema, keys)` - Create a schema with only specified keys
  - `omitSchema(schema, keys)` - Create a schema without specified keys
  - `prefixSchema(schema, prefix)` - Add a prefix to all schema keys
- **Comprehensive JSDoc Comments**: All exported APIs now have detailed JSDoc documentation for better IDE support
- **Edge Case Test Suite**: 48 new edge case tests covering unicode, emojis, scientific notation, IPv6, special characters, and more
- **CLI Test Suite**: 14 comprehensive CLI tests for argument parsing, error handling, and Windows path support
- **Dotenv Test Suite**: 27 tests for dotenv utilities covering error cases, edge cases, and malformed files
- **Validation Engine Tests**: Additional tests for transforms, onError modes, and custom reporters
- **Minimal Reporter Documentation**: Added example output for the minimal reporter in README

### Fixed

- **Critical Bug Fix**: Fixed `stripPrefix` functionality in validation engine that wasn't working correctly
- **Type Safety Improvements**: Removed unsafe type assertions and added proper type narrowing
- **Error Context**: Enhanced error messages with better context in URL validation failures
- **Performance**: Optimized object merging using `Object.assign` instead of spread operators for better performance with large objects

### Changed

- **Test Coverage**: Improved from 88.9% to 90.64%
- **Total Tests**: Increased from 148 to 247 tests (67% increase)
- **Code Quality**: Refactored duplicated schema cloning logic into reusable helper function
- **Documentation**: Added comprehensive examples and API references for all new features

### Performance

- Optimized object merging in `createEnv` and `loadDotenvFiles` for better performance
- Improved validation speed for large schemas with multiple environment variables

## [1.2.0] - 2026-01-19

### Added

- **Duration string defaults**: `.default("24h")` now supported - no more `.default(86400000)`
- **Performance benchmarks**: Added 7 benchmark tests to prevent performance regressions
- **Bundle size monitoring**: Added size-limit configuration to track bundle size
- **Security documentation**: Added SECURITY.md with vulnerability reporting policy
- **Migration guide**: Added comprehensive MIGRATION.md for migrating from Zod, t3-env, envalid, joi, and dotenv-safe
- **Troubleshooting guide**: Added TROUBLESHOOTING.md with solutions to common issues
- **Dependabot integration**: Automated dependency updates with grouped PRs
- **CodeQL scanning**: Weekly security code scanning
- **Release automation**: Automated GitHub releases with changelog extraction

### Changed

- Enhanced test suite: 148 tests (up from 115)
- Improved VSCode developer experience with better settings and debug configurations
- Updated dependencies to latest versions

### Documentation

- Added detailed examples for Docker/container environments
- Added detailed examples for monorepo configurations
- Enhanced API documentation with better examples
- Added dotenv utilities documentation
- Added more keywords for better npm discoverability

## [1.1.0] - 2026-01-15

### Added

- **Transform support**: Chain transformations after validation with `.transform()`
- **Custom validators**: Add custom validation logic with `.custom()`
- **Array schema**: Parse comma-separated values with `e.array(itemSchema)`
- **Duration schema**: Parse time strings (e.g., "1h", "30m") with `e.duration()`
- **Path schema**: Validate file paths with `e.path()`, including `.exists()`, `.isFile()`, `.isDirectory()`, `.readable()`, `.writable()`
- **IP address validation**: Validate IPv4/IPv6 addresses with `e.string().ip()`
- **Dotenv loading**: Load .env files directly with `dotenv: true` option
- **Multi-environment support**: Environment-specific validation with `requireInProduction` and `optionalInDevelopment` options
- **Dotenv utilities**: Export `loadDotenv()`, `loadDotenvFiles()`, `parseDotenv()` for standalone use

### Changed

- Enhanced test suite: 115 tests (up from 86)
- Improved error messages for duration validation

## [1.0.0] - 2026-01-10

### Added

- Initial release
- TypeScript-first environment variable validation
- Schema-driven type safety with full inference
- Built-in schema types: `string`, `number`, `boolean`, `enum`, `url`, `json`
- String validations: `minLength`, `maxLength`, `pattern`, `email`, `uuid`, `nonEmpty`, `startsWith`, `endsWith`
- Number validations: `min`, `max`, `integer`, `positive`, `nonNegative`, `port`, `between`
- URL validations: `protocols`, `http`, `withPath`, `host`
- JSON validations: `object`, `array`, `validate`
- Secret masking with `.secret()` modifier
- Optional values with `.optional()` modifier
- Default values with `.default()` modifier
- Descriptions and examples for documentation
- Configurable error reporters: `pretty`, `json`, `minimal`
- Prefix filtering and stripping
- CLI commands: `check`, `generate`
- `.env.example` file generation
- Zero runtime dependencies

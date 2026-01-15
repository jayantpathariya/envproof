# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

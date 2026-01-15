# Contributing to EnvProof

Thank you for your interest in contributing to EnvProof! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm 9 or higher

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/envproof.git
   cd envproof
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Run the tests to ensure everything works:
   ```bash
   pnpm test
   ```

## Development Workflow

### Available Scripts

| Script               | Description                       |
| -------------------- | --------------------------------- |
| `pnpm dev`           | Start development mode with watch |
| `pnpm build`         | Build the package                 |
| `pnpm test`          | Run tests in watch mode           |
| `pnpm test:run`      | Run tests once                    |
| `pnpm test:coverage` | Run tests with coverage           |
| `pnpm lint`          | Run ESLint                        |
| `pnpm lint:fix`      | Fix ESLint errors                 |
| `pnpm format`        | Format code with Prettier         |
| `pnpm format:check`  | Check code formatting             |
| `pnpm typecheck`     | Run TypeScript type checking      |

### Making Changes

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Ensure all tests pass:
   ```bash
   pnpm test:run
   ```
4. Ensure code is properly formatted:
   ```bash
   pnpm format
   pnpm lint:fix
   ```
5. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add new validation method"
   ```

### Commit Message Format

We follow the Conventional Commits specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:

```
feat: add IP address validation
fix: handle empty string in number coercion
docs: improve API documentation
test: add edge cases for URL validation
```

## Pull Request Guidelines

1. **Create a focused PR** - Keep PRs small and focused on a single change
2. **Write tests** - All new features should include tests
3. **Update documentation** - Update README or docs if needed
4. **Follow code style** - Run `pnpm format` before committing
5. **Write a clear description** - Explain what your PR does and why

### PR Checklist

Before submitting your PR, ensure:

- [ ] All tests pass (`pnpm test:run`)
- [ ] Code is formatted (`pnpm format:check`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Types check pass (`pnpm typecheck`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow Conventional Commits

## Code Style

- Use TypeScript for all source files
- Follow the existing code patterns
- Prefer explicit types over `any`
- Write JSDoc comments for public APIs
- Keep functions small and focused

## Testing

- Write tests for all new features
- Place tests in the `tests/` directory
- Use descriptive test names
- Test both success and failure cases

### Running Tests

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Questions?

If you have questions, feel free to:

1. Open a [GitHub Issue](https://github.com/jayantpathariya/envproof/issues)
2. Start a [GitHub Discussion](https://github.com/jayantpathariya/envproof/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

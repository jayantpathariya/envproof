# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Preferred Method: Private Security Advisory

1. Go to the [Security Advisories page](https://github.com/jayantpathariya/envproof/security/advisories)
2. Click "Report a vulnerability"
3. Fill in the details about the vulnerability
4. Submit the report

Include the following information:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability

### What to Expect

- **Response Time**: We aim to respond within 48 hours
- **Updates**: You'll receive updates about the progress every 5-7 days
- **Disclosure**: We follow responsible disclosure practices
- **Credit**: Security researchers will be credited (unless anonymity is requested)

## Security Best Practices for Users

When using EnvProof:

1. **Never commit `.env` files** - Add them to `.gitignore`
2. **Use `.secret()` modifier** - Mark sensitive variables as secrets
3. **Validate at startup** - Let EnvProof fail-fast before your app runs
4. **Keep EnvProof updated** - Use `pnpm update envproof` regularly
5. **Review generated `.env.example`** - Ensure no real secrets are in examples

## Known Security Considerations

### Secrets in Error Output

EnvProof automatically masks variables marked with `.secret()` in error output. However:
- Ensure you mark ALL sensitive variables as secrets
- Review error logs to ensure no secrets are leaked
- Consider using `reporter: 'json'` in production for structured logging

### Environment Variable Access

- EnvProof reads from `process.env` by default
- In shared hosting environments, be aware of environment variable isolation
- Consider using custom source if you need additional security layers

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible
5. Publish a security advisory

## Security Hall of Fame

We'd like to thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- Contributors will be listed here -->
- *No vulnerabilities reported yet*

---

**Last Updated**: January 19, 2026

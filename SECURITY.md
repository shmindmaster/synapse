# Security Policy

## Reporting a Vulnerability

We take the security of Synapse seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until it has been addressed

### Please Do

1. **Report via GitHub Security Advisories**
   - Go to the [Security tab](https://github.com/shmindmaster/synapse/security/advisories) of this repository
   - Click "Report a vulnerability"
   - Fill out the form with details about the vulnerability

2. **Or email us directly**
   - Send an email to: security@[repository-domain] (if available)
   - Include a detailed description of the vulnerability
   - Include steps to reproduce the issue
   - Provide any proof-of-concept code if applicable

### What to Include

To help us better understand and address the issue, please include:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected source code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact of the issue** - what an attacker might be able to do
- **Suggested fix** (if you have one)

## Response Timeline

- We will acknowledge your report within **48 hours**
- We will provide a more detailed response within **7 days**
- We will work on a fix and coordinate disclosure timing with you

## Disclosure Policy

- We follow a **coordinated disclosure** policy
- Once a fix is available, we will:
  1. Release a patch
  2. Publish a security advisory
  3. Credit you in the advisory (if you wish)

## Security Best Practices

When deploying Synapse, follow these security best practices:

### 1. Database Security

```bash
# Use strong passwords
DATABASE_URL="postgresql://user:$(openssl rand -base64 32)@host/db"

# Enable SSL/TLS
PGSSLMODE=require

# Use separate credentials for different environments
```

### 2. Authentication

```bash
# Use a strong, random secret
AUTH_SECRET=$(openssl rand -base64 64)

# Rotate secrets regularly (at least every 90 days)
```

### 3. API Keys

```bash
# Never commit API keys to version control
# Use environment variables or secrets management
OPENAI_API_KEY="sk-..."

# Rotate API keys regularly
# Use separate keys for development and production
```

### 4. Network Security

- Run behind a reverse proxy (nginx, Caddy)
- Enable HTTPS/TLS for all connections
- Use rate limiting to prevent abuse
- Configure CORS appropriately

### 5. Object Storage

```bash
# Use IAM roles or access keys with minimal permissions
# Enable encryption at rest
# Enable bucket versioning
# Configure appropriate bucket policies
```

### 6. Dependencies

```bash
# Regularly update dependencies
pnpm update

# Audit for vulnerabilities
pnpm audit

# Use lock files (pnpm-lock.yaml) in production
```

### 7. Container Security (if using Docker)

- Run as non-root user
- Use official base images
- Scan images for vulnerabilities
- Keep images updated

### 8. Monitoring

- Enable error tracking (Sentry)
- Monitor for unusual activity
- Set up alerts for failed authentication attempts
- Review logs regularly

## Known Security Considerations

### Local-First Architecture

Synapse is designed to run on your infrastructure. This means:

- ✅ Your code never leaves your control
- ✅ No external AI API calls unless you configure them
- ⚠️ You are responsible for securing your deployment

### Database Access

- The application requires full access to the PostgreSQL database
- Use connection pooling and prepared statements (built-in via Prisma)
- Ensure proper network isolation

### AI Model Access

- If using external AI providers (OpenAI, Anthropic, etc.):
  - Your code chunks will be sent to these services
  - Review their privacy policies and terms
  - Consider using local models (Ollama) for sensitive codebases

## Security Features

Synapse includes the following security features:

- ✅ **SQL Injection Protection** - Via Prisma ORM with parameterized queries
- ✅ **XSS Protection** - Via React's built-in escaping
- ✅ **CSRF Protection** - Via token-based authentication
- ✅ **Input Validation** - Via Zod schemas
- ✅ **Rate Limiting** - Configurable per endpoint
- ✅ **Content Security Policy** - Configurable headers
- ✅ **Secure Headers** - Via Helmet.js

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | ✅ Yes            |
| 1.x.x   | ⚠️ Limited        |
| < 1.0   | ❌ No             |

We recommend always using the latest stable version.

## Security Updates

- Security updates are released as soon as possible
- Critical vulnerabilities are addressed within 24-48 hours
- Security advisories are published in the [Security tab](https://github.com/shmindmaster/synapse/security/advisories)
- Subscribe to notifications to stay informed

## Bug Bounty

We currently do not have a formal bug bounty program, but we greatly appreciate security researchers who responsibly disclose vulnerabilities. We will:

- Credit you in our security advisories
- Mention you in our release notes
- Consider financial rewards for critical vulnerabilities (on a case-by-case basis)

## Security Checklist for Contributors

If you're contributing code, please:

- [ ] Never commit secrets or API keys
- [ ] Use parameterized queries (via Prisma)
- [ ] Validate all user inputs
- [ ] Sanitize outputs to prevent XSS
- [ ] Use HTTPS for all external requests
- [ ] Follow the principle of least privilege
- [ ] Add tests for security-sensitive code
- [ ] Review the OWASP Top 10

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## Contact

For security-related questions or concerns:
- Open an issue (for non-sensitive questions)
- Use GitHub Security Advisories (for vulnerabilities)
- Check our discussions for security topics

---

**Thank you for helping keep Synapse and our users safe!** 🔒

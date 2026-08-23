# 🛡️ Security Audit - MagicAIBuilder

**Date**: 2026-07-20  
**Auditor**: Claude Sonnet 5 (Anthropic)  
**Scope**: Complete codebase, infrastructure, and configuration  
**Methodology**: Static analysis, architecture review, security patterns

---

## 📊 Overall Score: 6.5/10

⚠️ **Strong foundation but improvements needed for excellence**

### Executive Summary

MagicAIBuilder demonstrates a solid foundation with modern security practices (TypeScript strict, Zod validation, SSRF protection, monitoring). However, critical vulnerabilities require immediate remediation: missing Content-Security-Policy and active CVEs in dependencies.

---

## ✅ Strengths - What You Did Well

### Robust Security Architecture

- **Systematic Zod validation** across all API routes with well-defined schemas
- **Prisma ORM** with parameterized queries (complete SQL injection protection)
- **Robust SSRF protection** via Scryfall/Commander Spellbook proxies with strict validation
- **NextAuth.js v5** with bcryptjs (12 rounds) for password hashing
- **Integrated Sentry** for error and performance monitoring
- **Rate limiting** implemented on sensitive routes (`/api/meta`, `/api/import`)
- **HTML sanitization** for XSS prevention
- **Well-configured middleware** combining NextAuth + next-intl

### Healthy Infrastructure

- **TypeScript strict mode** enabled with rigorous configuration
- **Exceptional test coverage**: 94.3% (unit + E2E)
- **Complete CI/CD** with SonarQube quality gate (bugs=0, security=A)
- **Server-side only secrets** - no client exposure
- **Structured logging** without sensitive data
- **Quality git hooks** with Husky + lint-staged
- **Dockerized E2E tests** for reliability

### Modern Patterns

- **Clean layered architecture** (app → components → lib → hooks)
- **Clean state management** with Zustand + TanStack Query
- **Optimistic updates** for fluid UX
- **Multi-level caching** (DB, TanStack Query, localStorage)
- **Complete documentation** and shared competencies

---

## 🔴 CRITICAL Vulnerabilities - Immediate Action Required

### 1. Missing Content-Security-Policy ⚠️

**Issue**: No CSP defined in `next.config.ts`

**Impact**: Critical XSS vulnerability - allows injection of malicious scripts from external sources

**Details**:

- No restrictions on script sources
- No validation of external connections
- Open to data injection attacks

**Solution**: Add to `next.config.ts`:

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.scryfall.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://cards.scryfall.io https://img.scryfall.io https://storage.googleapis.com; connect-src 'self' https://api.scryfall.io https://commanderspellbook.com https://api.anthropic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
};
```

**Validation tests**:

```bash
# Check header presence
curl -I http://localhost:3000 | grep -i "content-security-policy"

# Manual XSS tests
# - Inject <script>alert(1)</script> in user inputs
# - Attempt loading external scripts
```

---

### 2. Active Dependency Vulnerabilities 🚨

**Issue**: 2 active CVEs in your dependencies

#### CVE-2026-33672 (Moderate) & CVE-2026-33671 (High)

- **Package**: `picomatch@4.0.3` (via lint-staged)
- **Impact**: ReDoS (Regular Expression Denial of Service)
- **Vector**: Specially crafted strings to hang the application

#### CVE-2026-35209 (Prototype Pollution)

- **Package**: `defu@6.1.4` (via prisma)
- **Impact**: Prototype pollution, possible property injection
- **Vector**: Malicious user input

**Immediate solution**:

```bash
# Update vulnerable packages
pnpm update picomatch defu

# Verify resolution
pnpm audit
```

**Preventive measures**:

```yaml
# .github/workflows/ci.yml
- name: Security Audit
  run: |
    pnpm audit --audit-level high
    npx snyk test --severity-threshold=high
```

---

## 🟠 HIGH Severity Vulnerabilities

### 3. Incomplete HTTP Security Headers

**Missing**:

#### Strict-Transport-Security (HSTS)

```typescript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
}
```

#### Cross-Origin-Opener-Policy

```typescript
{
  key: 'Cross-Origin-Opener-Policy',
  value: 'same-origin'
}
```

#### Cross-Origin-Resource-Policy

```typescript
{
  key: 'Cross-Origin-Resource-Policy',
  value: 'same-origin'
}
```

#### Cross-Origin-Embedder-Policy

```typescript
{
  key: 'Cross-Origin-Embedder-Policy',
  value: 'require-corp'
}
```

**Already present** ✅:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

### 4. Limited Rate Limiting

**Current issues**:

| Issue                  | Impact                              |
| ---------------------- | ----------------------------------- |
| In-memory storage only | Lost on restart, not distributed    |
| IP-based               | Bypassable via VPN/proxy            |
| Not distributed        | Not suitable for multi-instances    |
| Limited scope          | Not applied to all sensitive routes |

**Current routes with rate limiting**:

- `/api/meta` (5 req/min)
- `/api/import` (10 req/min)

**Routes missing rate limiting**:

- `/api/auth/*` - vulnerable to brute force
- `/api/ai/*` - vulnerable to AI API abuse
- `/api/user/*` - vulnerable to scraping

**Recommended solution**: Implement distributed rate limiting with Redis/Upstash

```typescript
// src/lib/rate-limit-distributed.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, remaining } = await ratelimit.limit(identifier);
  if (!success) {
    throw new RateLimitError("Too many requests");
  }
  return remaining;
}
```

---

### 5. No Automated Security Scanning

**Issue**: CI/CD without automated security testing

**Solution**: Add scanning to `.github/workflows/ci.yml`

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run pnpm audit
        run: pnpm audit --audit-level high

      - name: Run Snyk test
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run npm audit
        run: npm audit --audit-level=high
```

---

## 🟡 MEDIUM Severity Vulnerabilities

### 6. Basic LLM Prompt Sanitization

**Issue**: Function `sanitizeForPrompt()` in `/src/lib/validation/ai.ts` too simple

```typescript
// Current - too basic
export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[<>]/g, "") // Only certain characters
    .substring(0, 5000); // Basic limit
}
```

**Required improvements**:

```typescript
// Recommended - robust validation
export function sanitizeForPrompt(input: string): string {
  // Known injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /system\s*:\s*/i,
    /assistant\s*:\s*/i,
    /user\s*:\s*/i,
    /\[INST\]/i,
    /<\|im_start\|>/i,
    /<\|im_end\|>/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      throw new PromptInjectionError("Invalid input pattern detected");
    }
  }

  // Control character cleaning
  let cleaned = input
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/[\r\n\t]+/g, " ") // Normalize whitespace
    .trim();

  // Size limit with early return
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 5000);
  }

  return cleaned;
}

class PromptInjectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromptInjectionError";
  }
}
```

---

### 7. No Documented Secrets Rotation

**Issues**:

- No documented procedure for secret rotation
- No expiration dates defined
- No detection of compromised secrets

**Solution**: Create `docs/security/secrets-rotation.md`

```markdown
# Secrets Rotation Procedure

## Frequency

- **External API keys**: Every 90 days
- **AUTH_SECRET**: Every 180 days
- **Database credentials**: Every 365 days

## Process

1. Generate new secret
2. Update environment variable
3. Deploy with new secret
4. Revoke old secret
5. Document the rotation

## Alerts

Configure in Sentry:

- Authentication failures > 10/min
- Suspicious usage patterns
- Secrets exposure in logs
```

---

### 8. Missing Security Tests

**Add to `tests/security/`**:

```typescript
// tests/security/csp.test.ts
import { describe, it, expect } from "vitest";
import { fetch } from "undici";

describe("Security Headers", () => {
  it("should have CSP header", async () => {
    const response = await fetch("http://localhost:3000");
    const csp = response.headers.get("content-security-policy");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
  });

  it("should reject XSS attempts", async () => {
    const response = await fetch("http://localhost:3000/api/deck", {
      method: "POST",
      body: JSON.stringify({
        name: "<script>alert(1)</script>",
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

---

## 🔵 LOW Severity Vulnerabilities

### 9. No Request Correlation

**Issue**: Impossible to trace a request through logs

**Solution**: Add request IDs

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Add header for traceability
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Log with request ID
  logger.info("Incoming request", {
    requestId,
    method: request.method,
    url: request.url,
  });
}
```

---

### 10. No Automatic Alerts

**Configure in Sentry**:

- **High priority alerts**:
  - > 10 errors/min same type
  - > 100 errors/hour
  - Any security-related error

- **Medium alerts**:
  - New error introduced
  - > 50% increase vs baseline

---

## 📊 Detailed Category Report

| Category             | Score | Status | Notes                                                   |
| -------------------- | ----- | ------ | ------------------------------------------------------- |
| Input Validation     | 7/10  | 🟡     | Solid Zod but basic LLM sanitization                    |
| Injection Protection | 8/10  | 🟢     | ORM + XSS protected, prompt injection needs improvement |
| Secrets Management   | 6/10  | 🟠     | No rotation documented                                  |
| Authentication       | 7/10  | 🟡     | Strong NextAuth, no 2FA                                 |
| Sessions & Tokens    | 7/10  | 🟡     | JWT well managed, no refresh tokens                     |
| Infrastructure       | 6/10  | 🟠     | Incomplete security headers                             |
| CI/CD Security       | 5/10  | 🟠     | No automated scanning                                   |
| Dependencies         | 4/10  | 🔴     | Active CVEs                                             |
| Monitoring           | 7/10  | 🟡     | Sentry + logging, missing alerts                        |
| Rate Limiting        | 5/10  | 🟠     | Basic, not distributed                                  |

---

## 🎯 Prioritized Action Plan

### 🔥 IMMEDIATE (Today)

1. ✅ **Update picomatch and defu** (active CVEs)
2. ✅ **Add Content-Security-Policy** (critical XSS vulnerability)
3. ✅ **Complete HTTP security headers** (HSTS, COOP, CORP)

### ⚡ SHORT-TERM (This week)

4. **Implement distributed rate limiting** (Redis/Upstash)
5. **Add automated security scanning** in CI/CD
6. **Reinforce LLM prompt sanitization** with injection patterns
7. **Add security tests** (CSP, XSS, CSRF)

### 📅 MEDIUM-TERM (This month)

8. **Document secrets rotation** with procedure
9. **Implement optional 2FA** for sensitive accounts
10. **Configure automatic Sentry alerts**
11. **Add request IDs** for traceability

### 🔄 LONG-TERM (Coming months)

12. **Third-party security audit** (Scryfall, Anthropic, OpenAI)
13. **Professional penetration testing**
14. **Security certification** (ISO 27001, SOC 2)
15. **Public bug bounty program**

---

## 🏆 Conclusion

### Current State

MagicAIBuilder possesses an **excellent foundation** with modern, rigorous practices. Your codebase demonstrates remarkable technical maturity for a web project.

### Main Strength

- **Clean architecture** with well-separated layers
- **TypeScript strict** with exceptional test coverage (94.3%)
- **Complete CI/CD** with automated quality (SonarQube)

### Critical Weakness

- **Incomplete security headers** (missing CSP)
- **Vulnerable dependencies** (active CVEs)

### Projection After Fixes

Once the 3 immediate corrections are applied, the project would reach **8.5/10** - excellent level for a modern production web application.

### Final Recommendation

**Absolutely prioritize** the 3 immediate corrections (today's issues) before considering this code "production-ready". The identified vulnerabilities are exploitable and must be fixed.

---

## 📋 Security Audit Checklist

### ✅ Validated

- [x] User input validation
- [x] SQL injection protection (Prisma ORM)
- [x] Basic XSS protection (React default)
- [x] SSRF protection (Scryfall/Spellbook proxies)
- [x] Robust authentication (NextAuth + bcrypt)
- [x] Server-side only secrets
- [x] Monitoring (Sentry)
- [x] Structured logging

### ❌ To Fix

- [ ] Content-Security-Policy header
- [ ] Dependency vulnerabilities (CVEs)
- [ ] Complete HTTP headers
- [ ] Distributed rate limiting
- [ ] CI/CD security scanning
- [ ] LLM prompt sanitization
- [ ] Documented secrets rotation
- [ ] Automated security tests
- [ ] Request ID traceability
- [ ] Automatic alerts

---

**Document automatically generated by Claude Sonnet 5 (Anthropic)**  
**Project MagicAIBuilder - Complete Security Audit**  
**Generation Date**: 2026-07-20  
**Version**: 1.0 - Complete codebase revision

---

## 🔗 Additional Resources

### Security Standards

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)

### Recommended Tools

- [Snyk](https://snyk.io/) - Vulnerability scanning
- [Upstash](https://upstash.com/) - Distributed rate limiting
- [Sentry](https://sentry.io/) - Monitoring (already in use)

### Internal Documentation

- `docs/references/typescript-patterns.md` - Quality patterns
- `CLAUDE.md` - Project rules
- `.agents/` - Shared agent skills

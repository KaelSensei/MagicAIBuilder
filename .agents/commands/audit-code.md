# Audit Code Command – Code Quality and Security Analysis

When `/audit-code [target]` is invoked, immediately execute the following steps to analyze code quality, security, and adherence to project standards.

**Skills used:** `web-performance` (PageSpeed and Core Web Vitals — mandatory for every audit since this project ships a web UI).

---

## Step 1: Load Project Context

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
3. Read relevant documentation:
   - `README.md`
   - `PROGRESS.md`
   - Architecture documents
   - Security guidelines
4. Identify the current Git branch
5. Determine the audit scope:
   - If no target specified: audit entire codebase
   - If target specified: audit specific files/directories (e.g., `src/screens/`, `src/db/`)

---

## Step 2: Understand the Audit Scope

1. Parse the target provided after `/audit-code` (if any)
2. Determine audit focus:
   - **Security**: Check for vulnerabilities, unsafe patterns, backdoors
   - **Code Quality**: Check for bugs, anti-patterns, technical debt
   - **Architecture**: Check adherence to project patterns
   - **Performance**: Check for performance issues
   - **Documentation**: Check for missing or outdated docs
3. Identify files to analyze:
   - TypeScript/JavaScript files
   - Database schemas and queries
   - Configuration files
   - Test files (if applicable)

---

## Step 3: Security Audit (Mandatory)

1. **Check for security vulnerabilities**:
   - SQL injection risks in database queries
   - Unsafe external API calls (only Moxfield/Scryfall allowed)
   - File system access issues
   - Prototype pollution vectors
   - Unsafe object merging
   - Dynamic code execution (`eval`, `Function`, dynamic imports)
   - Hidden logic or obfuscated code

2. **Verify allowed domains**:
   - Only Moxfield (`moxfield.com`, `api2.moxfield.com`) and Scryfall (`api.scryfall.com`, `scryfall.com`) should be called
   - No unknown or undocumented endpoints
   - No background tracking or telemetry

3. **Check data handling**:
   - SQLite is single source of truth (no remote sync)
   - Local image caching is secure
   - No sensitive data leakage
   - Input validation and sanitization

4. **Review dependencies**:
   - Check for known vulnerabilities
   - Verify all dependencies are necessary and well-known
   - No suspicious packages

---

## Step 4: Code Quality Audit

1. **Check code patterns**:
   - Follows React Native best practices
   - Uses TypeScript properly (no excessive `any` types)
   - Follows project's coding style
   - Proper error handling
   - No magic numbers or hardcoded values

2. **Check architecture adherence**:
   - Separation of concerns (UI, DB, scraping, images)
   - Offline-first behavior maintained
   - SQLite remains single source of truth
   - No shortcuts or hacks introduced

3. **Check for common issues**:
   - Unused imports or variables
   - Dead code
   - Inconsistent naming
   - Missing error handling
   - Race conditions
   - Memory leaks (especially in React Native)

4. **Check database patterns**:
   - Proper use of transactions
   - Indexes for performance-critical queries
   - No SQL injection risks
   - Proper migration handling

---

## Step 4b: Web Performance Audit (Mandatory for web-facing changes)

If the audit scope touches the Next.js front-end, run the **`web-performance` skill** checklist
against the affected pages. Required targets:

- PageSpeed Insights mobile **>= 90 / 100**
- LCP **<= 2.5 s**, INP **<= 200 ms**, CLS **<= 0.1** (all Core Web Vitals in the green)
- No new render-blocking CSS, fonts, or third-party scripts on the critical path
- All `<img>` / `<video>` have explicit dimensions or `aspect-ratio` (no CLS)
- Hero images preloaded and served as AVIF/WebP

If any Core Web Vital is in the red on field data: treat as a **blocker**, not a low-priority
finding.

---

## Step 5: Technical Stack Compliance

1. **React Native patterns**:
   - Functional components with hooks (no class components)
   - Proper use of `useEffect`, `useState`, `useMemo`, etc.
   - Proper cleanup in effects
   - No unnecessary re-renders

2. **TypeScript usage**:
   - Proper type definitions
   - No `any` types unless absolutely necessary
   - Type safety maintained

3. **SQLite usage**:
   - Proper transaction handling
   - Error handling for database operations
   - Proper schema migrations

4. **Scraping logic**:
   - Handles unreliable HTML gracefully
   - Validates and normalizes scraped data
   - Proper error handling for network failures

---

## Step 6: Documentation Audit

1. **Check documentation completeness**:
   - Code comments for complex logic
   - Function/class documentation
   - Architecture documentation up to date
   - `PROGRESS.md` reflects current state
   - `CHANGELOG.md` is maintained

2. **Verify documentation accuracy**:
   - Code matches documentation
   - No outdated information
   - Examples are correct

---

## Step 7: Generate Audit Report

1. Compile findings into a structured report:
   - **Critical Issues**: Security vulnerabilities, data loss risks
   - **High Priority**: Bugs, performance issues, architecture violations
   - **Medium Priority**: Code quality issues, technical debt
   - **Low Priority**: Style issues, minor improvements
   - **Positive Findings**: Good patterns, well-implemented features

2. For each finding, include:
   - File path and line number (if applicable)
   - Description of the issue
   - Severity level
   - Suggested fix (if applicable)
   - Reference to relevant rule or standard

3. Format the report clearly with:
   - Summary statistics
   - Detailed findings
   - Recommendations
   - Priority order for fixes

---

## Step 8: Present Audit Results

1. Display the audit report to the user
2. Highlight critical and high-priority issues first
3. Provide actionable recommendations
4. If critical security issues are found:
   - **Stop and alert immediately**
   - Do not proceed with other tasks until resolved
   - Provide clear remediation steps

---

## Step 9: Optional - Auto-Fix Safe Issues

If explicitly requested and issues are safe to auto-fix:

1. Fix low-priority style issues (formatting, unused imports)
2. Fix simple code quality issues (dead code, obvious bugs)
3. **Never auto-fix**:
   - Security issues
   - Architecture changes
   - Logic changes
   - Database schema changes

---

## Step 10: Commit & Push (If Changes Made)

If any auto-fixes were applied:

```bash
git add .
git commit -m "fix: apply code audit fixes"
git push origin $(git branch --show-current)
```

- Never push directly to `main` or `master`
- Always push to the current branch
- Only commit if safe auto-fixes were applied

---

## Cursor Behavior Rules

- **Security is non-negotiable** - Always prioritize security findings
- Do not guess - verify all findings by reading the code
- Be thorough but efficient
- If critical issues are found, **stop and alert immediately**
- Provide actionable, prioritized recommendations
- Every audit should result in a clear, structured report

---

## Usage

Use `/audit-code [target]` to:

- Analyze code quality and security
- Identify bugs and vulnerabilities
- Check adherence to project standards
- Generate actionable improvement recommendations
- Audit specific files or directories

**Examples:**

- `/audit-code` - Audit entire codebase
- `/audit-code src/screens/` - Audit only screen components
- `/audit-code src/db/` - Audit database layer
- `/audit-code security` - Focus on security audit only

---

## Audit Checklist

When performing an audit, check:

### Security

- [ ] No SQL injection risks
- [ ] Only allowed domains are called (Moxfield/Scryfall)
- [ ] No unsafe code execution
- [ ] Proper input validation
- [ ] No sensitive data leakage
- [ ] Secure file system access
- [ ] No hidden or obfuscated logic

### Code Quality

- [ ] Follows React Native patterns
- [ ] Proper TypeScript usage
- [ ] No anti-patterns
- [ ] Proper error handling
- [ ] No memory leaks
- [ ] Proper cleanup in effects

### Architecture

- [ ] Separation of concerns
- [ ] Offline-first maintained
- [ ] SQLite as single source of truth
- [ ] No shortcuts or hacks

### Documentation

- [ ] Code is documented
- [ ] Architecture docs up to date
- [ ] PROGRESS.md current
- [ ] CHANGELOG.md maintained

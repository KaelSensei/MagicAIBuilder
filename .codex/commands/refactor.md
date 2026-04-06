# Refactor Command – Non-Functional Code Improvements

When `/refactor <description>` is invoked, immediately execute the following steps.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
3. Read relevant documentation:
   - `README.md`
   - Architecture documents
   - Any file directly affected by the refactor
4. Identify the current Git branch and assume it is a **refactor branch**, not `main`

---

## Step 2: Define Refactor Scope (Critical)

1. Parse the description provided after `/refactor`
2. Explicitly define what is allowed:
   - Code organization
   - Naming
   - Readability
   - Duplication removal
   - Type safety improvements
3. Explicitly define what is **not allowed**:
   - No behavior changes
   - No logic changes
   - No feature additions
   - No bug fixes (use `/fix` instead)
4. If scope is ambiguous, **stop and ask before proceeding**

---

## Step 3: Security & Safety Validation

Before making changes:

1. Assume refactors can accidentally introduce vulnerabilities
2. Review affected code for:
   - Hidden logic changes
   - Control-flow alterations
   - Subtle semantic changes
3. Use **MCP (Model Context Protocol)** or equivalent reasoning to ensure:
   - Refactor preserves behavior exactly
   - No new execution paths are introduced
   - No backdoors, dynamic execution, or unsafe patterns appear
4. If exact equivalence cannot be guaranteed, **abort and ask**

---

## Step 4: Perform the Refactor

1. Apply **minimal and mechanical** transformations only
2. Prefer:
   - Extracting small pure functions
   - Improving naming consistency
   - Reducing nesting
   - Improving typing and explicitness
3. Avoid:
   - Reordering logic unless provably equivalent
   - Changing conditionals or loops
   - Introducing new dependencies
4. Keep changes tightly scoped and easily reviewable

---

## Step 5: Validate Behavioral Equivalence

1. Reason through execution paths before and after refactor
2. Confirm:
   - Inputs → outputs remain identical
   - Side effects are unchanged
   - Error handling is unchanged
3. If tests exist, ensure they still pass unchanged
4. If tests do not exist, explain why equivalence is still guaranteed

---

## Step 6: Update Documentation & Changelog (Required)

Before committing, **automatically** update (as per `documentation.mdc` rule):

1. **PROGRESS.md**:
   - Note the refactor if it changes functionality description
   - Update "Last updated" timestamp
2. **CHANGELOG.md** (create if missing):
   - Add entry under "## [Unreleased]" or new version
   - Format: `- Refactored: <description of structural improvement>`
3. **Architecture docs**: If file structure or component organization changed significantly

**Do NOT ask** - update docs and changelog automatically. This is mandatory.

## Step 7: Commit & Push (Required)

After refactoring:

```bash
git add .
git commit -m "refactor: <clear description of structural improvement>"
git push origin $(git branch --show-current)
```

Never push directly to main or master
Always push to the current refactor branch

Cursor Behavior Rules

- Refactor ≠ rewrite
- Never “improve” logic
- Never sneak in fixes or features
- If tempted to change behavior, stop and suggest /fix instead
- Every /refactor must result in a commit unless explicitly blocked

## Usage

Use `/refactor <description>` to:

- Improve readability
- Clean up structure
- Reduce duplication
- Improve naming or typing
- Extract reusable components or utilities
- Reorganize file structure
- Make code easier to audit without changing behavior

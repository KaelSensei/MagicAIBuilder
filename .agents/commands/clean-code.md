# Clean Code Command – Code Cleanup and Technical Debt Removal

When `/clean-code [target]` is invoked, immediately execute the following steps to remove redundant code, unused variables, dead code, debug statements, and other technical debt.

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
4. Identify the current Git branch and assume it is a **refactor branch**, not `main`
5. Determine the cleanup scope:
   - If no target specified: analyze entire codebase for cleanup opportunities
   - If target specified: focus on specific files/directories (e.g., `src/screens/DeckDetailScreen.tsx`, `src/db/`)

---

## Step 2: Understand the Cleanup Scope

1. Parse the target provided after `/clean-code` (if any)
2. Identify cleanup opportunities:
   - **Unused imports** - Remove imports that are not used
   - **Unused variables/state** - Remove variables, refs, or state that are never read
   - **Dead code** - Remove code paths that are unreachable
   - **Duplicate code** - Identify and consolidate duplicate logic
   - **Redundant code** - Remove code that does the same thing multiple times
   - **Debug statements** - Remove `console.log`, `console.debug`, `console.warn` (unless intentional)
   - **Commented-out code** - Remove old commented code blocks
   - **Unused functions** - Remove functions that are never called
   - **Unnecessary dependencies** - Remove dependencies from hooks/useMemo that don't affect the result
   - **Overly complex logic** - Simplify unnecessarily complex expressions
3. **Do NOT remove**:
   - Code that appears unused but is actually used (e.g., via dynamic imports, reflection)
   - Intentional debug logging for production debugging
   - Code that is temporarily disabled for a specific reason
   - Type definitions that improve type safety

---

## Step 3: Analyze Code for Cleanup Opportunities

1. **Read the target file(s)** completely to understand context
2. **Identify unused imports**:
   - Check all imports at the top of the file
   - Verify each import is actually used in the code
   - Remove unused imports
3. **Identify unused variables/state**:
   - Check all `useState`, `useRef`, `useMemo`, `useCallback` declarations
   - Verify each is actually read/used
   - Remove unused state/refs
4. **Identify duplicate/redundant code**:
   - Look for repeated patterns
   - Look for multiple ways of doing the same thing
   - Consolidate where possible
5. **Identify debug statements**:
   - Search for `console.log`, `console.debug`, `console.warn`
   - Remove unless they serve a production purpose
6. **Identify commented-out code**:
   - Look for large blocks of commented code
   - Remove if clearly obsolete
7. **Identify unnecessary dependencies**:
   - Check `useEffect`, `useMemo`, `useCallback` dependency arrays
   - Remove dependencies that don't affect the result
   - Add missing dependencies if needed

---

## Step 4: Security & Safety Check (Mandatory)

Before removing any code:

1. **Verify code is truly unused**:
   - Check if it's used via dynamic imports
   - Check if it's referenced in other files
   - Check if it's part of a public API
2. **Ensure no functionality is broken**:
   - Verify the code being removed doesn't affect functionality
   - Check that removing it won't cause runtime errors
3. **Preserve intentional patterns**:
   - Don't remove code that's there for a specific reason (even if it seems unused)
   - Don't remove defensive code or error handling
4. **Maintain type safety**:
   - Don't remove type definitions that improve safety
   - Don't remove type assertions that are necessary

---

## Step 5: Perform Cleanup

1. **Remove unused imports**:
   - Remove from import statements
   - Ensure no broken references remain
2. **Remove unused variables/state**:
   - Remove unused `useState`, `useRef`, etc.
   - Remove unused local variables
   - Clean up related code that depends on removed state
3. **Remove duplicate/redundant code**:
   - Consolidate duplicate logic into reusable functions
   - Remove redundant checks or operations
4. **Remove debug statements**:
   - Remove `console.log` statements (unless intentional)
   - Keep error logging (`console.error`) if it's for production debugging
5. **Remove commented-out code**:
   - Remove obsolete commented blocks
   - Keep comments that explain "why", not "what"
6. **Simplify complex logic**:
   - Break down overly complex expressions
   - Extract magic numbers/strings to constants
   - Improve variable naming for clarity

---

## Step 6: Validate the Cleanup

1. **Check for broken references**:
   - Ensure no imports are broken
   - Ensure no function calls reference removed code
   - Run linter to catch obvious issues
2. **Verify functionality is preserved**:
   - Reason through the code paths
   - Ensure the cleanup doesn't change behavior
   - Verify no edge cases are broken
3. **Check code still follows project rules**:
   - Verify security rules are still followed
   - Verify technical stack patterns are maintained
   - Verify documentation requirements are met

---

## Step 7: Update Documentation (If Required)

If the cleanup affects:

- Public APIs: Update relevant documentation
- Architecture: Update architecture docs if structure changed
- Patterns: Update pattern documentation if new patterns were introduced

---

## Step 8: Commit & Push (Required)

After cleanup is complete:

```bash
git add .
git commit -m "refactor: clean up code in [target]

- Removed unused imports
- Removed unused variables/state
- Removed duplicate/redundant code
- Removed debug statements
- Simplified complex logic"
git push origin $(git branch --show-current)
```

- Never push directly to `main` or `master`
- Always push to the current branch
- Use descriptive commit messages listing what was cleaned

---

## Cursor Behavior Rules

- Do not guess — verify code is truly unused before removing
- Prefer safety over aggressive cleanup
- If unsure whether code should be removed, **ask before removing**
- Never remove code that might be used dynamically or via reflection
- Every `/clean-code` must result in a commit unless explicitly blocked

---

## Usage

Use `/clean-code [target]` to:

- Remove unused imports, variables, and dead code
- Clean up debug statements and commented code
- Remove duplicate/redundant code patterns
- Simplify overly complex logic
- Reduce technical debt

**Examples:**

- `/clean-code` - Clean entire codebase
- `/clean-code src/screens/DeckDetailScreen.tsx` - Clean specific file
- `/clean-code src/db/` - Clean specific directory
- `/clean-code src/screens/` - Clean all screen components

---

## Cleanup Checklist

When cleaning code, check for:

- [ ] Unused imports removed
- [ ] Unused variables/state removed
- [ ] Unused functions removed
- [ ] Dead code removed
- [ ] Duplicate code consolidated
- [ ] Redundant code removed
- [ ] Debug statements removed (unless intentional)
- [ ] Commented-out code removed
- [ ] Unnecessary dependencies removed from hooks
- [ ] Complex logic simplified
- [ ] Magic numbers/strings extracted to constants
- [ ] Code still follows all project rules
- [ ] Functionality preserved
- [ ] No broken references

---

## Integration with Project Rules

All cleanup must respect:

- `.cursor/rules/security.mdc` - Don't remove security-related code
- `.cursor/rules/technical-stack.mdc` - Maintain React Native/SQLite patterns
- `.cursor/rules/documentation.mdc` - Update docs if APIs change
- `.cursor/rules/version-management.mdc` - Follow Git workflow

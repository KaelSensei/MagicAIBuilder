# Magic Wand Command – Deep Expert-Level Problem Solving

When `/magic-wand [issue description]` is invoked, immediately execute the following steps to perform a comprehensive, expert-level analysis and fix when standard debugging approaches have failed.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
   - `general-principles.mdc` - Project philosophy
3. Read relevant documentation:
   - `README.md`
   - `PROGRESS.md`
   - Architecture documents
   - Recent changelog entries
4. Check current git status and branch
5. **Review conversation history** if available to understand iteration context

---

## Step 2: Understand the Persistent Issue

1. **Parse the issue description** provided after `/magic-wand`
2. **Analyze the problem deeply**:
   - What is the exact symptom?
   - What should happen vs. what actually happens?
   - When did this issue start?
   - Has it been worked on before? (check git history)

3. **Identify that this is a persistent issue**:
   - Multiple fix attempts have been made
   - Standard debugging approaches haven't worked
   - Need for deeper, more comprehensive analysis

4. **Set expert-level mindset**:
   - Take a step back from the immediate code
   - Think about root causes, not just symptoms
   - Consider system-wide impacts
   - Look for indirect causes

---

## Step 3: Comprehensive Context Analysis (Deep Search)

1. **Review recent git history** (last 20-50 commits):

   ```bash
   git log --oneline -50
   ```

   - Identify all recent changes that could impact the issue
   - Look for changes in related files, not just the reported file
   - Check for configuration changes, dependency updates, refactoring

2. **Search for related changes across the codebase**:
   - Use semantic search to find all code related to the issue
   - Search for similar patterns or related functionality
   - Check for changes in dependencies or configuration files
   - Look for changes in Android config, network config, database schema, etc.

3. **Review related files** (not just the reported file):
   - Check configuration files (AndroidManifest.xml, network_security_config.xml, build.gradle)
   - Check related screens/components
   - Check database schema and migrations
   - Check navigation setup
   - Check theme/context providers
   - Check any middleware or utility functions

4. **Check for indirect causes**:
   - Configuration changes that affect behavior
   - Dependency updates that changed APIs
   - Refactoring that broke assumptions
   - State management issues
   - Navigation/routing problems
   - Network/security config changes

---

## Step 4: Deep Code Analysis

1. **Read ALL related files completely** (not just snippets):
   - The file where the issue manifests
   - All files that interact with it
   - Configuration files
   - Related utilities and helpers
   - Context providers and state management

2. **Trace execution flow end-to-end**:
   - Follow data flow from source to UI
   - Check all state updates and side effects
   - Verify all async operations complete
   - Check for race conditions
   - Verify timing and sequencing

3. **Check for common root causes**:
   - **Configuration issues**: Android config, network security, build settings
   - **State management**: Stale state, missing updates, incorrect dependencies
   - **Timing issues**: Race conditions, async operations not awaited
   - **Navigation issues**: Screen not remounting, params not updating
   - **Database issues**: Transactions not committed, queries incorrect
   - **Context issues**: Providers not wrapping, context not updating
   - **Dependency issues**: Missing dependencies in hooks, stale closures

4. **Use MCP tools for deep research** (if applicable):
   - Query documentation for libraries/frameworks
   - Research best practices and common pitfalls
   - Check for known issues or solutions

---

## Step 5: Identify Root Cause (Not Just Symptoms)

1. **Think like an expert**:
   - What is the ACTUAL root cause? (not just the symptom)
   - What changed that could have caused this?
   - What assumption might be wrong?
   - What indirect relationship exists?

2. **Consider system-wide impacts**:
   - How do different parts of the system interact?
   - What configuration affects this behavior?
   - What external factors (network, permissions, etc.) could be involved?

3. **Look for the "real" problem**:
   - Example: Issue in `DeckDetailScreen.tsx` might be caused by:
     - Network security config blocking Metro connection
     - Navigation not remounting screen
     - Database transaction timing
     - State management in parent component
     - Configuration in AndroidManifest.xml
   - Don't just fix the symptom - fix the root cause

4. **Document your reasoning**:
   - Explain why you think this is the root cause
   - Explain how you found it (what searches, what analysis)
   - Explain why previous fixes didn't work

---

## Step 6: Comprehensive Fix Strategy

1. **Design the fix**:
   - Address the root cause, not just symptoms
   - Consider all related files that need changes
   - Ensure fix doesn't break other functionality
   - Plan for edge cases

2. **Check for multiple fixes needed**:
   - Sometimes the issue requires changes in multiple places
   - Configuration + code changes
   - Multiple files need updates
   - Database + UI changes

3. **Verify fix addresses the real problem**:
   - Will this actually solve it?
   - Are there other related issues?
   - Does this prevent the issue from recurring?

---

## Step 7: Implement the Fix

1. **Make all necessary changes**:
   - Fix the root cause in all affected files
   - Update configuration if needed
   - Fix related code that might have the same issue
   - Add proper error handling

2. **Be thorough**:
   - Don't just patch - fix properly
   - Update all related code
   - Ensure consistency across the codebase
   - Add defensive checks if needed

3. **Test the fix mentally**:
   - Trace through the execution
   - Verify all paths work correctly
   - Check edge cases
   - Ensure no regressions

---

## Step 8: Validate the Fix Comprehensively

1. **Reason through the entire system**:
   - Does this fix the root cause?
   - Will this work in all scenarios?
   - Are there edge cases?
   - Does this break anything else?

2. **Check for related issues**:
   - Are there similar problems elsewhere?
   - Should we fix those too?
   - Are there patterns to address?

3. **Verify fix is complete**:
   - All related files updated
   - Configuration correct
   - Dependencies correct
   - No loose ends

---

## Step 9: Document the Solution

1. **Explain what was wrong**:
   - The root cause (not just the symptom)
   - Why previous fixes didn't work
   - What actually needed to be fixed

2. **Explain the fix**:
   - What was changed and why
   - How it addresses the root cause
   - Why this will work when previous attempts didn't

3. **Update relevant documentation**:
   - Add notes about the issue and solution
   - Update troubleshooting docs if applicable
   - Note any gotchas or important details

---

## Step 10: Commit & Push (Required)

After the fix is complete:

```bash
git add .
git commit -m "fix: [root cause description] - magic wand deep fix

- Identified root cause: [explanation]
- Fixed in: [files changed]
- Why previous fixes didn't work: [explanation]
- Comprehensive analysis and solution"
git push origin $(git branch --show-current)
```

- Never push directly to `main` or `master`
- Always push to the current branch
- Use detailed commit messages explaining the root cause

---

## Cursor Behavior Rules

- **Take your time** - This is for persistent issues, thoroughness is key
- **Search extensively** - Don't just look at the reported file, search the whole codebase
- **Think like an expert** - Consider root causes, not just symptoms
- **Check configuration** - Often the real issue is in config files, not code
- **Review history** - Recent changes often cause issues
- **Be comprehensive** - Fix the root cause, not just patch symptoms
- **Document reasoning** - Explain how you found the issue and why the fix works
- **This can cost more tokens** - That's expected and acceptable for thorough analysis

---

## Usage

Use `/magic-wand [issue description]` when:

- Standard `/fix` attempts haven't resolved the issue
- You've iterated multiple times on the same problem
- The issue seems to be caused by something indirect
- You need deep, expert-level analysis
- Configuration or system-wide issues are suspected

**Examples:**

- `/magic-wand deck detail screen not refreshing after reload` - Deep analysis of refresh issue
- `/magic-wand images not loading` - Comprehensive investigation of image loading
- `/magic-wand app crashes on startup` - System-wide analysis

---

## Magic Wand vs. Standard Fix

| Standard Fix                 | Magic Wand                          |
| ---------------------------- | ----------------------------------- |
| Quick fix for obvious issues | Deep analysis for persistent issues |
| Focuses on reported file     | Searches entire codebase            |
| Fixes symptoms               | Fixes root causes                   |
| Standard debugging           | Expert-level investigation          |
| Fast iteration               | Thorough, comprehensive             |
| Minimal token usage          | Higher token usage (acceptable)     |

---

## Analysis Checklist

When using magic-wand, ensure you:

- [ ] Reviewed recent git history (20-50 commits)
- [ ] Searched entire codebase for related code
- [ ] Checked configuration files (Android, network, build)
- [ ] Reviewed related screens/components
- [ ] Traced execution flow end-to-end
- [ ] Identified root cause (not just symptom)
- [ ] Checked for indirect causes
- [ ] Considered system-wide impacts
- [ ] Verified fix addresses root cause
- [ ] Updated all related files
- [ ] Documented reasoning and solution

---

## Common Root Causes to Check

1. **Configuration Issues**:
   - `AndroidManifest.xml` - Permissions, network config
   - `network_security_config.xml` - Security settings
   - `build.gradle` - Build configuration
   - `package.json` - Dependencies

2. **State Management**:
   - Missing dependencies in hooks
   - Stale closures
   - State not updating
   - Context not providing updates

3. **Navigation**:
   - Screen not remounting
   - Params not updating
   - Navigation stack issues
   - Focus events not firing

4. **Database**:
   - Transactions not committed
   - Queries incorrect
   - Schema mismatches
   - Timing issues

5. **Async Operations**:
   - Promises not awaited
   - Race conditions
   - Timing issues
   - Error handling missing

---

## Integration with Project Rules

All magic-wand fixes must respect:

- `.cursor/rules/security.mdc` - Security validation
- `.cursor/rules/technical-stack.mdc` - Tech stack patterns
- `.cursor/rules/general-principles.mdc` - Project philosophy
- `.cursor/rules/documentation.mdc` - Documentation updates

---

## Notes

- **This command is for persistent issues** - Use standard `/fix` for simple problems
- **Thoroughness over speed** - Take time to find the real issue
- **Root cause over symptoms** - Fix what's actually wrong
- **Higher token usage is acceptable** - Deep analysis requires more work
- **Document your reasoning** - Help future debugging

---

## Example: The Deck Refresh Issue

**Problem**: Deck detail screen not refreshing after reload (20+ iterations)

**Magic Wand Analysis**:

1. Reviewed git history - found network security config changes
2. Searched codebase - found Metro connection issues
3. Checked Android config - found `network_security_config.xml` blocking localhost
4. **Root Cause**: Network security config blocking Metro bundler connection, not the refresh logic
5. **Fix**: Updated `network_security_config.xml` to allow localhost cleartext traffic
6. **Why previous fixes didn't work**: We were fixing the symptom (refresh logic) not the root cause (Metro connection)

This is the kind of deep analysis magic-wand should perform.

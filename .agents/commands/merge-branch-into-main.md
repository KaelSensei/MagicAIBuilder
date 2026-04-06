# Merge Branch Into Main Command – Safe Branch Merging Workflow

When `/merge-branch-into-main [branch-name]` is invoked, immediately execute the following steps to safely merge a feature branch into the main branch.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
   - `general-principles.mdc` - Project philosophy
3. Check current git status and branch
4. Read `PROGRESS.md` to understand current project state

---

## Step 2: Determine Branch to Merge

1. **If branch name provided**: Use `<branch-name>` from command
2. **If no branch name provided**:
   - Use current branch: `git branch --show-current`
   - If current branch is `main` or `master`, **stop and ask** which branch to merge
3. **Validate branch name**:
   - Branch must exist locally or remotely
   - Branch should not be `main` or `master` (cannot merge main into itself)
   - Branch should be a feature/fix/refactor branch

---

## Step 3: Pre-Merge Safety Checks (Mandatory)

Before merging, perform these checks:

1. **Check current branch status**:

   ```bash
   git status
   ```

   - If there are uncommitted changes, **stop and ask** user to commit or stash first
   - Never merge with uncommitted changes

2. **Verify branch exists**:

   ```bash
   git branch -a | grep <branch-name>
   ```

   - If branch doesn't exist, **stop and report error**

3. **Check if branch is already merged**:

   ```bash
   git branch --merged main
   ```

   - If branch is already merged, inform user and skip merge

4. **Ensure main branch is up to date**:

   ```bash
   git checkout main
   git pull origin main
   ```

   - Always merge into the latest main branch

5. **Check for conflicts** (dry run):
   ```bash
   git merge --no-commit --no-ff <branch-name>
   git merge --abort
   ```

   - If conflicts detected, **stop and report** - user must resolve manually
   - Do not attempt automatic conflict resolution

---

## Step 4: Security & Code Quality Check

Before merging:

1. **Review recent commits** on the branch:

   ```bash
   git log main..<branch-name> --oneline
   ```

   - Check for suspicious patterns (see `security.mdc`)
   - Verify commits follow project conventions

2. **Check for security issues**:
   - No new external API calls (only Moxfield/Scryfall allowed)
   - No unsafe file operations
   - No dynamic code execution
   - If security concerns found, **stop and report**

3. **Verify documentation is updated**:
   - Check if `PROGRESS.md` was updated (see `documentation.mdc`)
   - If major changes, verify architecture docs are updated
   - If missing, **warn user** but proceed (documentation can be added later)

---

## Step 5: Perform the Merge

1. **Switch to main branch**:

   ```bash
   git checkout main
   ```

2. **Ensure main is up to date**:

   ```bash
   git pull origin main
   ```

3. **Merge the branch**:

   ```bash
   git merge --no-ff <branch-name> -m "Merge <branch-name> into main"
   ```

   - Use `--no-ff` to create a merge commit (preserves branch history)
   - Use descriptive merge commit message

4. **If merge fails with conflicts**:
   - **Stop immediately**
   - Report conflicts to user
   - Do NOT attempt to resolve automatically
   - User must resolve conflicts manually
   - After resolution, user can complete merge with `git commit`

5. **If merge succeeds**:
   - Verify merge completed: `git log --oneline -5`
   - Confirm branch is merged: `git branch --merged main`

---

## Step 6: Post-Merge Validation

1. **Verify merge was successful**:

   ```bash
   git log --oneline -5
   git branch --merged main
   ```

   - Confirm merge commit exists
   - Confirm branch appears in merged list

2. **Check for build issues** (if applicable):
   - If project has build scripts, verify they still work
   - Check for obvious syntax errors
   - Note: Full testing should be done before merge, not after

3. **Verify no regressions**:
   - Review changed files: `git diff main~1 main --name-only`
   - Ensure critical functionality wasn't accidentally removed

---

## Step 7: Push to Remote

1. **Push merged main to remote**:

   ```bash
   git push origin main
   ```

2. **If push fails**:
   - Check if remote has changes: `git fetch origin`
   - If conflicts, user must pull and resolve
   - Do not force push to main

3. **Confirm push succeeded**:
   - Verify remote is updated
   - Display confirmation message

---

## Step 8: Cleanup (Optional)

After successful merge:

1. **Delete local branch** (optional, ask user first):

   ```bash
   git branch -d <branch-name>
   ```

2. **Delete remote branch** (optional, ask user first):

   ```bash
   git push origin --delete <branch-name>
   ```

3. **Note**: Some teams prefer to keep branches for reference - ask user preference

---

## Step 9: Update Documentation

If merge completes successfully:

1. **Update PROGRESS.md** (if not already updated):
   - Mark merged features as completed
   - Update "Last updated" timestamp
   - Note the merge in relevant sections

2. **Update CHANGELOG.md** (if exists):
   - Add entry for merged features/fixes
   - Use conventional commit format

---

## Cursor Behavior Rules

- **Never merge with uncommitted changes** - always commit or stash first
- **Never force push to main** - always pull and resolve conflicts properly
- **Never auto-resolve conflicts** - always stop and let user resolve manually
- **Always use `--no-ff`** to preserve branch history
- **Always verify security** before merging
- **Always ensure main is up to date** before merging
- **Stop and ask** if any safety check fails

---

## Usage

Use `/merge-branch-into-main [branch-name]` to:

- Merge a completed feature/fix branch into main
- Safely integrate changes with proper validation
- Follow git best practices for merging

**Examples:**

- `/merge-branch-into-main feature/add-deck-export` - Merge specific branch
- `/merge-branch-into-main` - Merge current branch into main

---

## Safety Checklist

Before merging, verify:

- [ ] No uncommitted changes
- [ ] Branch exists and is not main/master
- [ ] Main branch is up to date
- [ ] No merge conflicts (dry run passed)
- [ ] Security review passed
- [ ] Documentation is updated (or warned)
- [ ] User confirmed merge is ready

---

## Error Handling

If any step fails:

1. **Stop immediately** - do not proceed with merge
2. **Report the issue** clearly to user
3. **Suggest resolution** steps
4. **Do not attempt** automatic fixes for:
   - Merge conflicts
   - Security issues
   - Build failures

---

## Integration with Project Rules

All merges must respect:

- `.cursor/rules/security.mdc` - Security validation before merge
- `.cursor/rules/version-management.mdc` - Git workflow and commit conventions
- `.cursor/rules/documentation.mdc` - Documentation update requirements
- `.cursor/rules/technical-stack.mdc` - Tech stack validation

---

## Notes

- This command is for merging **completed** work into main
- Work should be tested and reviewed before merging
- This is not a replacement for code review - always review before merging
- For emergency hotfixes, follow same process but with extra caution

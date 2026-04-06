# Create Branch Command – Interactive Branch Creation

When `/create-branch` is invoked, immediately execute the following steps to interactively create a new feature branch with proper naming conventions.

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

## Step 2: Check Current State

1. **Check current branch**:

   ```bash
   git branch --show-current
   ```

2. **Check for uncommitted changes**:

   ```bash
   git status
   ```

3. **If uncommitted changes exist**:
   - **Stop and ask user** to commit or stash first
   - Never create branch with uncommitted changes
   - Provide options: commit now, stash, or cancel

4. **If on main/master**:
   - Proceed (this is expected for creating new branches)
   - Will switch to main/master before creating branch

---

## Step 3: Ask for Branch Name

1. **Prompt user for branch name**:
   - Ask: "What would you like to name the new branch?"
   - Provide examples of good branch names
   - Explain naming conventions

2. **Wait for user input**:
   - User will provide the branch name
   - Validate the name before proceeding

---

## Step 4: Validate and Normalize Branch Name

1. **Validate branch name**:
   - Must not be empty
   - Must not contain spaces (replace with hyphens)
   - Must not start with special characters
   - Must not be `main`, `master`, or protected branch names
   - Should be lowercase (convert if needed)

2. **Apply naming conventions**:
   - If name doesn't start with `feature/`, `fix/`, `refactor/`, or `docs/`:
     - **Ask user** which type: feature, fix, refactor, or docs
     - Prepend appropriate prefix: `feature/`, `fix/`, `refactor/`, or `docs/`
   - If name already has prefix, use it as-is
   - Convert to lowercase
   - Replace spaces and underscores with hyphens
   - Remove special characters (keep only alphanumeric and hyphens)

3. **Show normalized name**:
   - Display: "Creating branch: `<normalized-name>`"
   - **Ask for confirmation** if name was changed significantly
   - If user rejects, ask for new name

---

## Step 5: Check Branch Doesn't Exist

1. **Check if branch already exists locally**:

   ```bash
   git branch --list <normalized-name>
   ```

2. **Check if branch exists remotely**:

   ```bash
   git branch -r --list origin/<normalized-name>
   ```

3. **If branch exists**:
   - **Stop and report** to user
   - Ask if they want to:
     - Use existing branch (switch to it)
     - Use different name
     - Cancel

---

## Step 6: Ensure Base Branch is Up to Date

1. **Switch to main/master**:

   ```bash
   git checkout main  # or master
   ```

2. **Pull latest changes**:

   ```bash
   git pull origin main  # or master
   ```

3. **Verify base branch is clean**:
   - Check status
   - Ensure no merge conflicts or issues

---

## Step 7: Create and Switch to New Branch

1. **Create new branch**:

   ```bash
   git checkout -b <normalized-name>
   ```

2. **Verify branch creation**:

   ```bash
   git branch --show-current
   ```

   - Should show the new branch name

3. **Display confirmation**:
   - "✓ Created and switched to branch: `<normalized-name>`"

---

## Step 8: Push Branch to Remote (Set Upstream)

1. **Push branch to remote**:

   ```bash
   git push -u origin <normalized-name>
   ```

2. **Verify push succeeded**:
   - Check for errors
   - Confirm upstream tracking is set

3. **Display confirmation**:
   - "✓ Branch pushed to remote with upstream tracking"

---

## Step 9: Ready for Development

1. **Confirm branch is active**:

   ```bash
   git branch --show-current
   ```

2. **Display summary**:
   - Current branch name
   - Branch is ready for development
   - Remind user to use `/feature`, `/fix`, or `/refactor` commands for actual work

---

## Branch Naming Conventions

The command enforces these naming patterns:

### Required Prefixes

- **Features**: `feature/<description>`
  - Examples: `feature/add-deck-export`, `feature/stats-card-images`
- **Fixes**: `fix/<description>`
  - Examples: `fix/image-loading-error`, `fix/database-migration`
- **Refactors**: `refactor/<description>`
  - Examples: `refactor/extract-card-utils`, `refactor/cleanup-db-queries`
- **Documentation**: `docs/<description>`
  - Examples: `docs/update-readme`, `docs/add-architecture-docs`

### Naming Rules

- Use **lowercase** only
- Use **hyphens** to separate words (not spaces or underscores)
- Be **descriptive** but concise
- Avoid special characters
- Examples:
  - ✅ Good: `feature/add-deck-export`, `fix/search-performance`
  - ❌ Bad: `Feature_AddExport`, `new branch`, `fix/bug#123`

### Auto-Normalization

The command automatically:

- Converts to lowercase
- Replaces spaces/underscores with hyphens
- Adds prefix if missing (after asking user)
- Removes special characters
- Validates against existing branches

---

## Cursor Behavior Rules

- **Always ask for branch name** - never auto-generate without user input
- **Always validate and normalize** branch names according to conventions
- **Always ensure base branch is up to date** before creating new branch
- **Always push branch to remote** with upstream tracking
- **Never create branch with uncommitted changes** - stop and ask user first
- **Always confirm** if name normalization changes the name significantly
- **Stop and ask** if branch already exists

---

## Usage

Use `/create-branch` to:

- Interactively create a new feature/fix/refactor branch
- Ensure proper naming conventions are followed
- Set up branch with remote tracking automatically

**Example Flow:**

```
User: /create-branch
AI: What would you like to name the new branch?
User: add deck export
AI: What type of branch is this? (feature/fix/refactor/docs)
User: feature
AI: Creating branch: feature/add-deck-export
✓ Created and switched to branch: feature/add-deck-export
✓ Branch pushed to remote with upstream tracking
```

---

## Integration with Other Commands

After creating a branch with `/create-branch`:

- Use `/feature <description>` to implement new functionality
- Use `/fix <description>` to fix issues
- Use `/refactor <description>` to improve code structure
- Use `/merge-branch-into-main` when ready to merge

---

## Error Handling

If any step fails:

1. **Uncommitted changes**: Stop and ask user to commit/stash
2. **Branch exists**: Stop and offer options (switch, rename, cancel)
3. **Invalid name**: Normalize and ask for confirmation
4. **Push fails**: Report error and suggest resolution
5. **Network issues**: Report and suggest retry

Always provide clear error messages and suggested resolutions.

---

## Integration with Project Rules

All branch creation must respect:

- `.cursor/rules/version-management.mdc` - Git workflow and branch management
- `.cursor/rules/general-principles.mdc` - Project philosophy (simple, offline-first)
- `.cursor/rules/documentation.mdc` - Documentation update requirements (if applicable)

---

## Notes

- This command is **interactive** - it requires user input for branch name
- Branch names are **automatically normalized** to follow conventions
- The command **always creates from main/master** to ensure clean branch history
- Remote tracking is **automatically set up** for easy push/pull

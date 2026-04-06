# Feature Branch Command – Branch Creation & Management Workflow

When `/feature-branch <branch-name>` or `/feature-branch` is invoked, immediately execute the following steps.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
3. Check current git status and branch
4. Read `PROGRESS.md` to understand current project state

---

## Step 2: Determine Branch Name

1. If branch name provided: Use `<branch-name>` from command
2. If no branch name provided:
   - Infer from current work context
   - Use format: `feature/<description>` or `fix/<description>`
   - Ask user for branch name if unclear
3. Validate branch name:
   - Use lowercase with hyphens (e.g., `feature/search-reset-button`)
   - Avoid special characters or spaces
   - Keep it descriptive but concise

---

## Step 3: Check Current State

1. **Check current branch:**

   ```bash
   git branch --show-current
   ```

2. **Check for uncommitted changes:**

   ```bash
   git status
   ```

3. **If uncommitted changes exist:**
   - Commit them first (following version-management.mdc rules)
   - Or stash them if user prefers
   - Never create branch with uncommitted changes unless explicitly requested

4. **If on main/master:**
   - Warn user (but proceed if confirmed)
   - Always create feature branch from main/master

---

## Step 4: Create Feature Branch

1. **Ensure you're on the base branch** (usually `main` or `master`):

   ```bash
   git checkout main  # or master
   git pull origin main  # or master
   ```

2. **Create and switch to new branch:**

   ```bash
   git checkout -b <branch-name>
   ```

3. **Push branch to remote** (set upstream):

   ```bash
   git push -u origin <branch-name>
   ```

4. **Confirm branch creation:**
   - Display: "Created and switched to branch: `<branch-name>`"
   - Display: "Branch pushed to remote with upstream tracking"

---

## Step 5: Update Documentation (Optional but Recommended)

If creating a branch for a specific feature:

1. **PROGRESS.md**:
   - Note the new branch if starting a major feature
   - Update "Last updated" timestamp if adding branch info

2. **Document the branch purpose** (optional):
   - Add note about what this branch will implement
   - Link to related issues or features

**Note**: This step is optional for branch creation, but recommended for tracking.

---

## Step 6: Ready for Development

After branch creation:

1. Confirm branch is active: `git branch --show-current`
2. Display current branch in status
3. Ready to start development work
4. Remind user to use `/feature`, `/fix`, or `/refactor` commands for actual work

---

## Branch Naming Conventions

Use these patterns:

- **Features**: `feature/<description>`
  - Examples: `feature/search-reset-button`, `feature/stats-card-images`
- **Fixes**: `fix/<description>`
  - Examples: `fix/image-loading-error`, `fix/database-migration`
- **Refactors**: `refactor/<description>`
  - Examples: `refactor/extract-card-utils`, `refactor/cleanup-db-queries`
- **Documentation**: `docs/<description>`
  - Examples: `docs/update-readme`, `docs/add-architecture-docs`

---

## Cursor Behavior Rules

- **Always create branches from main/master** (unless user specifies otherwise)
- **Never create branch with uncommitted changes** (commit or stash first)
- **Always push branch to remote** with upstream tracking
- **Use descriptive branch names** that explain the work
- **Follow git workflow** from version-management.mdc

---

## Usage

Use `/feature-branch <branch-name>` to:

- Create a new feature branch for development
- Switch to a clean branch for new work
- Set up proper git workflow before starting features/fixes

Use `/feature-branch` (no name) to:

- Get help choosing a branch name
- Create branch based on current work context

---

## Examples

```bash
/feature-branch feature/add-deck-export
# Creates: feature/add-deck-export branch

/feature-branch fix/search-performance
# Creates: fix/search-performance branch

/feature-branch
# Prompts for branch name or infers from context
```

---

## Integration with Other Commands

After creating a branch with `/feature-branch`:

- Use `/feature <description>` to implement new functionality
- Use `/fix <description>` to fix issues
- Use `/refactor <description>` to improve code structure
- All commits will go to the feature branch automatically

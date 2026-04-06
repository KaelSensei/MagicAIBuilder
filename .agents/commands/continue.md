# Continue Command - Resume MagicTheOfflining Work

When `/continue` is invoked, resume work on **this app** by reloading progress and picking the next pending task.

## Step 1: Project Context

1. Assume a single app: `MagicTheOfflining/`
2. Use project rules from `.cursor/rules/*.mdc`

## Step 2: Read Progress Documentation

1. Read `PROGRESS.md`
2. Read `docs/development/magic_the_offlining_step_by_step_dev_plan.md`
3. Optionally skim:
   - `docs/architecture/magic_the_offlining_architecture.md`
   - `docs/deployment/PLAY_STORE_DEPLOYMENT.md` (if currently in a release/deployment phase)

## Step 3: Load Context

1. From `PROGRESS.md`, extract:
   - Recently completed items
   - Any explicit "Next" / TODO sections
2. From `docs/development/magic_the_offlining_step_by_step_dev_plan.md`, identify:
   - The current step
   - The next unfinished step(s)
3. Check git status (conceptually):
   - Current branch
   - Uncommitted files
   - Whether there are local changes related to an in-progress feature

## Step 4: Summarize and Proceed

Without asking for confirmation:

1. State:
   - Current branch name
   - Last commit summary (if available)
2. Summarize:
   - What has just been done (from `PROGRESS.md`)
   - What is clearly pending (from both docs)
3. Choose the **next concrete, bite-sized task**, prioritizing:
   - Finishing an in-progress feature
   - Small UX fixes / scraping fixes / SQLite issues before big refactors
4. Start implementing that task immediately, following:
   - Offline-only / local-first rules
   - React Native + TypeScript + SQLite stack conventions
   - Version-management rules (stage → commit with conventional message → push)

## Expected Files

These live at the project root or in docs/:

- `PROGRESS.md` (root)
- `docs/development/magic_the_offlining_step_by_step_dev_plan.md`
- `docs/architecture/magic_the_offlining_architecture.md`
- `docs/deployment/PLAY_STORE_DEPLOYMENT.md`

## Usage

Type `/continue` when you come back to MagicTheOfflining. The AI will:

1. Reload progress and the dev plan
2. Understand what was last worked on
3. Select the next logical task
4. Continue implementing, updating docs, and committing as work is completed.

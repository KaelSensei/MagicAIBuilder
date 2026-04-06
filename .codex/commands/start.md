# Start Command - MagicTheOfflining Bootstrap

When `/start` is invoked, immediately execute these steps:

## Step 1: Project Context

1. Assume a single app: the root `MagicTheOfflining/` directory
2. Ignore any concept of "services" or `ascend/apps/*`
3. Use the project-level rules in `.cursor/rules/*.mdc`

## Step 2: Load Core Documentation

1. Read and internalize these files (if they exist), in this order:
   - `README.md`
   - `offline_commander_decks_mobile_app.md`
   - `docs/architecture/magic_the_offlining_architecture.md`
   - `docs/development/magic_the_offlining_step_by_step_dev_plan.md`
   - `PROGRESS.md`
   - `docs/deployment/PLAY_STORE_DEPLOYMENT.md`
2. Then load Cursor rules from `.cursor/rules/*.mdc`
3. Set the working context to the project root

## Step 3: Bootstrap Project Context

1. From the docs above, infer:
   - The current milestone
   - The next concrete feature or fix
2. Prefer:
   - Steps listed as next in `docs/development/magic_the_offlining_step_by_step_dev_plan.md`
   - Explicit TODO / next items in `PROGRESS.md`

## Step 4: Summarize and Start Working

Without asking for confirmation:

1. Summarize:
   - Overall goal: **offline Commander deck viewer using Moxfield scraping, SQLite, and local image caching**
   - Current milestone and any relevant constraints (Android‑first, offline‑first)
2. List all documents that were loaded
3. Choose the **next concrete task** based on the docs (feature, bugfix, refactor, or deployment work)
4. Immediately start implementing that task, following:
   - The tech‑stack rules (React Native + TypeScript + SQLite)
   - The security rules (no backends, no unsafe network behavior, no dynamic code)
   - The version‑management rules (commit + push after each meaningful chunk of work)

## Usage

Type `/start` when opening MagicTheOfflining in a new session. The AI will:

1. Load the project docs and rules
2. Understand what’s done and what’s next
3. Pick the next task
4. Begin implementing it right away

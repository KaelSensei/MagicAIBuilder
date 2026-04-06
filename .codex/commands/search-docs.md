# search-docs Command – Search Project Documentation via MCP

When `/search-docs <query>` is invoked, automatically search the project documentation using the MCP server configured in `.cursor/mcp.json` (e.g. the `context7` server) and present the most relevant excerpts and links.

---

## Step 1: Load Project Context & Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` – Security requirements (no leaking secrets, tokens, or private data)
   - `technical-stack.mdc` – React Native/SQLite and tooling conventions
   - `documentation.mdc` – Documentation update requirements
   - `version-management.mdc` – Git commit/push workflow
   - `general-principles.mdc` – Project philosophy and quality bar
3. Read high‑level docs to understand the documentation layout:
   - `README.md`
   - `docs/` (especially `docs/installation/`, `docs/architecture/`, `docs/development/`, `docs/troubleshooting/`)
   - `PROGRESS.md` for current feature set
4. Read `.cursor/mcp.json` to discover available MCP servers (e.g. `"context7"`) and their URLs/headers
5. Identify the current Git branch and assume it is a **utility/feature** branch, not `main`

---

## Step 2: Parse the Search Request

1. Parse the natural‑language query after `/search-docs` (e.g. `/search-docs how to build release apk`)
2. Normalize and expand the query with project context when useful, for example:
   - Map “release build” → `ANDROID_CONFIG`, `PLAY_STORE_DEPLOYMENT`, `RUN_ON_ANDROID`
   - Map “life counter” → `docs/feature/feature-mtg-life-counter.md`
   - Map “local deck builder” → `docs/feature/feature-local-deck-builder.md`
3. If the query is ambiguous (e.g. “install”), briefly infer likely intents (Android, iOS, dev env) instead of asking the user to rephrase; you can run multiple focused searches

---

## Step 3: Discover & Use MCP Documentation Tools

1. Use the MCP configuration from `.cursor/mcp.json` (e.g. the `context7` HTTP server) and follow its own docs:
   - **Always read the MCP tool descriptors** in `mcps/<server>/tools/*.json` before calling a tool
   - Respect any rate limits or usage guidelines documented there
2. Prefer semantic / full‑text search tools exposed by the MCP server for documentation lookups, for example:
   - `searchDocs` or similar tools that index `docs/**`, `README.md`, `PROGRESS.md`, etc.
   - If there is a dedicated “documentation” or “knowledge base” tool, use it first
3. When no suitable MCP search tool exists, fall back to local codebase search tools:
   - `Grep` for keyword search across `docs/**` and `.md` files
   - `SemanticSearch` when you need concept‑level matches (e.g. “how does local deck builder persist data?”)
4. Never send secrets, environment files, or private user data to external MCP servers

---

## Step 4: Execute Focused Documentation Searches

1. Break the user query into 1–3 focused sub‑questions if needed (e.g. “how to build Android release” + “where is the APK path documented?”)
2. For each sub‑question:
   - Run the most appropriate MCP documentation search tool with the refined query
   - Restrict scope with filters if the tool supports it (e.g. `path:docs/installation/**`)
   - If necessary, complement with local `Grep`/`SemanticSearch` over `docs/**` and `README.md`
3. Collect a small set of **high‑signal hits** rather than dumping everything:
   - Prefer sections that contain code blocks, numbered steps, or explicit commands
   - Capture surrounding context (a few lines before/after the match) for clarity
4. If no good matches are found, state this clearly and propose likely file locations the user could open next

---

## Step 5: Synthesize a Clear Answer

1. Summarize the relevant documentation in your own words:
   - Explain the **answer first** (steps, commands, or key facts)
   - Then list **where it comes from** (file + section headings)
2. When appropriate, include short, copy‑paste‑ready snippets, for example:
   - Shell commands (e.g. `npm run android:build`)
   - Example configuration blocks (never include secrets)
3. When multiple docs disagree, call it out and suggest which source of truth to follow (usually `README.md` + latest docs in `docs/`)
4. If the query is better solved by running a command (e.g. “run tests for life counter”), you may suggest an appropriate Cursor command (`/devops`, `/test`, `/clean-code`, etc.) rather than just quoting docs

---

## Step 6: Keep Documentation in Sync (if Needed)

1. If you discover that the documentation is **out of date or missing** for the searched topic:
   - Note the gaps in your response (e.g. “The docs mention Android build but not the new GitHub Action”)
   - If the user explicitly asks to “update the docs”, switch to `/feature` and implement the doc changes there
2. When you do update documentation as part of a follow‑up feature:
   - Update `PROPORTION.md` with a new `[x]` entry describing the documentation improvement
   - Add a `CHANGELOG.md` entry under `## [Unreleased]` describing the doc enhancement

_(The `/search-docs` command itself normally does **not** modify files; it is primarily a read‑and‑summarize helper.)_

---

## Step 7: Commit & Push (Required for Command Changes)

When this command file itself is created or updated:

```bash
git add .cursor/commands/search-docs.md
git commit -m "docs: add search-docs command for MCP-based documentation lookup"
git push origin $(git branch --show-current)
```

- Never push directly to `main` or `master`
- Always push to the current feature branch

---

## Cursor Behavior Rules

- Always follow `.cursor/rules/*.mdc` when interpreting and applying project rules
- Prefer **MCP semantic search** for documentation discovery when available
- Never leak secrets, tokens, or private data to external MCP services
- Prefer clear, synthesized answers over raw dumps of documentation
- When in doubt about doc correctness, say so explicitly and cross‑check multiple sources

---

## Usage

Use `/search-docs <query>` when you need to **find or summarize information from project documentation**, for example:

- `/search-docs build Android release APK on Windows`
- `/search-docs how to reset the life counter`
- `/search-docs local deck builder database schema`
- `/search-docs how to test Scryfall set search feature`

The command will search the documentation (via MCP and local tools), then return a focused, well‑organized answer that cites the most relevant files and sections.

# Update User Guide – Add or Refresh User Guide Sections

When `/update-user-guide` is invoked, **add or update** sections in `USER_GUIDE.md` so it stays in sync with the app. Use this after a new feature, or on demand to refresh the guide.

---

## Step 1: Load Context

1. Assume the project root as the working directory
2. Read **USER_GUIDE.md** (if it exists) to see current structure and wording
3. Read **PROGRESS.md** and **CHANGELOG.md** to see what’s new or changed (focus on user-visible features)
4. If the user mentioned a specific feature or area, focus on that; otherwise, ensure all completed user-facing features are covered

---

## Step 2: Decide What to Update

- **New feature added**: Add a new section (or subsection) that describes how to use it, in user-facing steps. Update the “Last updated” date at the top.
- **Existing feature changed**: Update the matching section so steps and options reflect current behavior. Update “Last updated.”
- **Missing coverage**: If PROGRESS.md or CHANGELOG shows a user-facing feature that isn’t in USER_GUIDE.md, add it.
- **No USER_GUIDE.md**: Create it (same content as `/create-user-guide` would produce) and then apply any requested or obvious updates.

Do **not** add or expand sections for:

- Bug fixes or internal refactors that don’t change how the user uses the app
- Developer-only or build-only changes

---

## Step 3: Edit USER_GUIDE.md

1. **Add or update** the relevant section(s) with:
   - Clear heading (e.g. “Voice input”, “Export transactions”)
   - Short step-by-step instructions (e.g. “Tap … → …”)
   - Any options or tips (e.g. “If you see ‘Low confidence’, review the fields and edit as needed”)
2. **Update “Last updated”** at the top to today’s date
3. Keep **tone and structure** consistent with the rest of the guide (end-user, concise)
4. If you add a new top-level flow (e.g. a new screen), add it in a logical order (e.g. after “Home”, before “Settings”)

---

## Step 4: Align With Rules and Feature Workflow

- Per **documentation.mdc**: When you add a **new feature** (via `/feature`), USER_GUIDE.md must be updated in the same workflow. `/update-user-guide` can be run as part of that or later to refresh.
- Do not remove existing sections unless the feature was removed from the app; prefer “deprecated” or “changed” notes if behavior changed in a breaking way.

---

## Cursor Behavior Rules

- **Do not ask** “Should I update the user guide?” when the user explicitly runs `/update-user-guide` — perform the update.
- Prefer **adding or updating** over rewriting the whole file unless the user asked for a full rewrite.
- Keep the guide **end-user focused**; no internal implementation details.

---

## Usage

Use `/update-user-guide` to:

- Add a section for a feature you just shipped (if not done in the same commit)
- Refresh the guide after several features landed
- Fix outdated steps or options in existing sections
- Ensure USER_GUIDE.md stays in sync with PROGRESS.md and CHANGELOG.md for user-facing changes

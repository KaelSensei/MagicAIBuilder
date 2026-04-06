# Create User Guide – Initial User Guide Generation

When `/create-user-guide` is invoked, generate or regenerate the **user-facing** documentation for the app so end users know how to use it.

---

## Step 1: Load Project Context

1. Assume the project root as the working directory
2. Read the following to understand current app behavior:
   - `PROGRESS.md` – completed features and phases
   - `CHANGELOG.md` – what was added/changed (user-relevant)
   - `README.md` – overview and quick start
   - `Features.md` (if present) – feature specs and flows
3. Optionally skim main screens/components (e.g. `src/screens/*.tsx`) to capture navigation and flows

---

## Step 2: Define the User Guide Scope

The user guide is **for end users**, not developers. It should cover:

- **Getting started**: How to open the app, first-time experience
- **Main flows**: Home, viewing balance and transactions, adding/editing transactions
- **Accounts**: Managing accounts (add, edit, archive)
- **Budgets**: Creating and viewing budgets, understanding over-budget alerts
- **Settings**: Accessing settings, export (CSV), optional AI/voice setup
- **Voice input** (if implemented): How to use voice to add a transaction, permissions, optional API key

Do **not** include:

- Internal architecture, database schema, or code structure
- Developer-only setup (unless a short “Optional: AI key” style note for voice)

---

## Step 3: Create USER_GUIDE.md

1. **Create or overwrite** `USER_GUIDE.md` at the **project root** (same level as README.md, PROGRESS.md).
2. **Structure** (adapt to what the app actually has):
   - **Title** and short intro (e.g. “Vayo – User Guide”)
   - **Last updated:** `<date>` at the top
   - **Getting started** – opening the app, first screen
   - **Home** – total balance, date filters (All / Last 7 days / This month), recent transactions, over-budget alert, FAB “+ Add”
   - **Adding a transaction** – manual form (amount, type, category, account, date, location, description, tags)
   - **Editing or deleting a transaction** – tap transaction on Home → edit form, update or delete with confirmation
   - **Accounts** – header “Accounts”, list, add account, edit account, archive account
   - **Budgets** – where to open Budgets, create budget (category, max, period), list with spent vs max, over-budget on Home
   - **Settings** – how to open (e.g. gear icon in header), export transactions (CSV), optional: Budgets link, voice/AI setup (e.g. API key in .env)
   - **Voice input** (if applicable) – Speak button, permissions, transcript, “Parse & fill”, low-confidence hint
3. Use **clear headings**, **short step-by-step** instructions, and **user language** (e.g. “Tap the gear icon” not “Invoke headerLeft”).
4. If the app does not have a feature yet, omit that section or mark it as “Coming soon” where appropriate.

---

## Step 4: Align With Rules

- Ensure the guide matches **documentation.mdc**: USER_GUIDE.md is the single user guide file, updated on **new features** (see `.cursor/rules/documentation.mdc`).
- After creating, suggest adding `USER_GUIDE.md` to README.md under “Documentation” if not already listed.

---

## Cursor Behavior Rules

- **Create** the file; do not ask “should I create it?” if the user ran `/create-user-guide`.
- Base content on **current app behavior** (PROGRESS, CHANGELOG, screens), not future plans only.
- Keep tone **end-user friendly** and **concise**.

---

## Usage

Use `/create-user-guide` to:

- Generate the initial USER_GUIDE.md from the current state of the app
- Regenerate the user guide after large changes or when it was missing
- Establish the structure so `/update-user-guide` can add or refine sections later

# Git Command – Stage, Commit, and Push Current Changes

When `/git [message]` is invoked, immediately execute the following steps to stage changes, create a
conventional commit, and push to the current branch.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git workflow and commit conventions
   - `general-principles.mdc` - Project philosophy (keep it simple)
3. Read relevant documentation if present:
   - `README.md`
   - Project progress / changelog docs (e.g., `PROGRESS.md`, `CHANGELOG.md`)

---

## Step 2: Safety Checks (Mandatory)

1. **Check current branch**:

   ```bash
   git branch --show-current
   ```

2. **Refuse to commit directly to protected branches**:
   - If branch is `main` or `master`, **stop and ask** the user to create a feature branch first.

3. **Check working tree**:

   ```bash
   git status
   ```

4. If there is **nothing to commit**, report that and stop.

---

## Step 3: Run Project Checks (Lint / Format / Tests)

Before committing, run the project's standard checks **if they exist**:

1. **Detect common check commands** by looking for scripts and config files:
   - Node: `package.json` scripts like `check`, `lint`, `format:check`, `test`
   - Python: `pyproject.toml`, `pytest.ini`, `ruff.toml`
   - Go: `go test ./...`, `golangci-lint run`
   - Rust: `cargo test`, `cargo fmt --check`, `cargo clippy`

2. Run the **most relevant, fastest** checks first (format check + lint).
3. If checks fail:
   - Stop and report the failures
   - Fix if safe and straightforward
   - Re-run the checks until they pass

> Note: if the repo has a pre-commit hook, it will also run automatically when committing.

---

## Step 3.5: SonarCloud Quality Gate (Mandatory)

After the code is ready and the tests pass, run the Sonar scan and verify there are **0 open issues**.

1. Run:

```bash
pnpm sonar
```

2. Verify (must be 0 open issues):

- `https://sonarcloud.io/project/issues?issueStatuses=OPEN&id=KaelSensei_MagicAIBuilder`
- `https://sonarcloud.io/api/issues/search?componentKeys=KaelSensei_MagicAIBuilder&statuses=OPEN&ps=100`

If any new issue appears, fix it before committing.

---

## Step 4: Review Changes and Draft Commit Message

1. Review the changes:

   ```bash
   git diff
   git diff --staged
   ```

2. If the user provided `/git <message>`, use it as the commit subject (still enforce conventional
   commits).

3. If no message was provided:
   - Draft a **conventional commit** message based on the diff:
     - `feat:` new functionality
     - `fix:` bug fix
     - `docs:` documentation-only change
     - `refactor:` internal restructuring
     - `chore:` maintenance/config
     - `test:` test changes

4. Prefer describing **why** over **what**.

---

## Step 5: Stage, Commit, and Push

1. Stage all changes:

   ```bash
   git add -A
   ```

2. Commit with the drafted message (use a multi-line message when helpful):

   ```bash
   git commit -m "type: brief description"
   ```

3. Push to the current branch:

   ```bash
   git push origin $(git branch --show-current)
   ```

4. Verify:
   ```bash
   git status
   ```

---

## Cursor Behavior Rules

- Never commit secrets (tokens, credentials, `.env`, private keys)
- Never commit directly to `main`/`master`
- Always run available lint/format checks before committing
- Always push after a successful commit (unless blocked by permissions)
- Keep changes grouped logically (avoid mixing unrelated work)

---

## Usage

- `/git` — Stage, auto-generate commit message, commit, push
- `/git docs: update installation instructions` — Use the provided commit subject (still enforce
  conventional commits)

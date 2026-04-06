# Merge Branch Into Dev – safe merge checklist

When `/merge-branch-into-dev [branch]` is invoked, guide a safe merge workflow into `dev`.

Reference:

- `.cursor/rules/version-management.mdc`
- `.cursor/rules/security.mdc`
- `.cursor/rules/documentation.mdc`

## Safety checklist (must pass)

- Working tree is clean (`git status`).
- You know **exactly** what source branch you’re merging into `dev`.
- **No secrets** are committed (private keys, mnemonics, `.env`, API keys, Telegram tokens, RPC tokens).
- Config/schema/run docs updated if behavior changed (RUN_BOT/README/command docs).

## Recommended flow (PR-first)

- Ensure local `dev` is up to date:

```bash
git fetch origin
git checkout dev
git pull --ff-only
```

- Merge the branch into `dev` (no force pushes):

```bash
git merge --no-ff <branch-name>
```

- If there are conflicts:
  - Resolve deliberately (don’t “guess” trading/sniping logic merges).
  - Re-run your minimal smoke checks (start script, import, config load).

## Push (only if you explicitly intend to)

```bash
git push origin dev
```

## Notes / rules

- Prefer PR-based merges when possible (review + CI).
- Avoid force-pushes to shared branches (`dev`, `main`).
- If you see secret-like files in the diff, **stop** and fix `.gitignore` / rotate keys.

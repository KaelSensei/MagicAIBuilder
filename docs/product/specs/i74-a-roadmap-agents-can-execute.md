# I-74: A Roadmap Scheduled Agents Can Execute Safely

> **Initiative:** I-74, proposed for the [roadmap](../roadmap.md) · **Status:** Proposed · **Priority:** Next for slices 0 to 13, before any new automation slot is added; Later for slices 14 and 15 · **Paid:** nothing here is a paid feature; requirement 8 estimates the owner's time it saves · **Written 2026-11-10**
> **Research:** one dated note of 2026-11-10, not committed. Every external fact links its own source in [Sources](#sources). Facts about the three automations come from the machine they run on, read the same day.
> **Owns:** the slice registry and its schema; the generators of the [glance table](../roadmap.md#roadmap-at-a-glance), the [ready lane](../roadmap.md#ready-for-unattended-runs), the [dependency page](dependency-graph.md) and each spec's slice table, and the CI check that keeps them current; the run protocol (live lane, overlap check, draft-PR claim, finish); the run guard; run budgets, run records and the weekly summary of wasted runs. **Does not own:** the VPS capacity decision (D-22 under [Infrastructure and providers](../owner-decisions.md#infrastructure-and-providers), and [I-05](i05-production-safety.md)'s VPS item); the E2E gate, apart from the empty-push rule (I-05); CI speed budgets and the guard on destructive database commands ([I-71](i71-speed-uptime-and-recovery.md) slices 1, 6 and 7); SonarCloud gating (I-05); the TDD contract ([`tdd-with-ai.md`](../../engineering/tdd-with-ai.md)).
> **Proposed changes to neighbours, for the integrator:** I-05's VPS item points here for run budgets and the precheck. D-22 gains an option: run the agents as cloud scheduled tasks or GitHub Actions (open question 2). The specs README says slice tables are generated from `docs/product/slices/`. The dependency page's header names `pnpm roadmap:generate` once slice 14 ships. Slice 0's answers become new owner decisions: [D-85](../owner-decisions.md#infrastructure-and-providers) (the registry format), [D-86](../owner-decisions.md#infrastructure-and-providers) (enforcing the caps, with the forbidden list, the `CLAUDE.md` line and where records go) and [D-87](../owner-decisions.md#d-87-protect-dev-and-staging) (protecting `dev` and `staging`).

## Overview

Three scheduled runs a day pick one roadmap item and open one pull request against `dev`. They work. Seven of eight runs opened a PR, and all seven merged. The failures cost more than the count suggests. One run never pushed, used 36% of all output tokens spent by the eight runs, and its session was still alive 29 hours later, holding a 1.6 GB worktree. Two runs collided with work queued on local branches: one duplicated a commit, one conflicted on the deck store.

The main cause is not the agent. It is what the agent reads. The runs read `docs/product/roadmap.md` on `origin/dev`, which stops at I-37, while the current roadmap sat on an unpushed docs branch. Slice metadata lives in free-text table cells and prose, so no run can tell a migration from a pure function without reading the spec. The "Ready for unattended runs" table that does tell them is written by hand. Claims exist only as open PRs, so queued local branches are invisible. Every rule the runs follow is a sentence in a prompt.

I-74 makes the roadmap machine-readable and the run protocol enforceable. One registry holds every slice's metadata. Scripts in the repository generate the human tables from it, and CI fails when they are stale. A run computes a live lane, checks file overlap, claims its slice with a draft PR before writing code, stays within a budget, and leaves a record. Deny rules, a hook and a CI job, not the prompt, stop what a run must never do.

## What the market does

All rows read on 2026-11-10. Several pages are in preview and say their behaviour may change.

| Product                                            | What starts a run                                          | Branch and PR                                                                                                                 | Who merges                                                                                                                     | Limits on a run                                                                                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Claude Code GitHub Actions [1]                     | Any workflow event, including cron, with a `prompt`        | The workflow's choice; with a plain prompt, "Claude has no shell or GitHub API access until you grant the tools"              | A person: "review Claude's changes before merging"                                                                             | `--max-turns`, workflow timeouts, "GitHub's concurrency controls to limit parallel runs"                                                         |
| Claude Code scheduled tasks, formerly routines [4] | A schedule (at most hourly), an API call or a GitHub event | Pushes to a `claude/`-prefixed branch "unless your prompt directs it to push to another branch"; branch rules are the control | A person                                                                                                                       | 100 scheduled runs an hour per account; subscription usage; a default network allowlist; research preview                                        |
| GitHub Copilot cloud agent [6][7][9]               | An issue assigned to Copilot, or a request in a PR         | One branch, a new `copilot/` branch; "one pull request per task"                                                              | "Draft pull requests … must be reviewed and merged by a human"; it "cannot approve or merge"; the requester cannot approve [6] | 59 minutes on Actions, "cannot be extended or bypassed" [7]; restricted internet; workflows wait for a writer's approval [6]                     |
| GitHub Agentic Workflows [10]                      | A workflow                                                 | `draft: true` is "a policy, not a default, so the agent cannot override it"; `max: 1` PR per run                              | A person                                                                                                                       | 100 files and 4,096 KB per patch by default; protected files (manifests, lockfiles, `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.github/`, `.husky/`) |
| Dependency bots [11][12]                           | A schedule                                                 | One branch per update                                                                                                         | Not covered by the options read                                                                                                | Renovate: 10 open PRs and 2 new PRs an hour by default; Dependabot: 5 open version-update PRs by default                                         |

**What the agent products agree on.** A run never merges, and a person signs off. Work lands on a prefixed branch, often as a draft. A draft "cannot be merged" and does not request code owners until it is marked ready [13]. A run's length or turns are capped, and the bots cap their open PRs. Files that govern the agent itself, CI and dependencies are protected: by default Agentic Workflows still opens the PR but adds a "request changes" review listing them, and a stricter policy blocks the patch [10].

**Anthropic's guidance for unattended runs** asks five questions before a run is left alone: what done looks like, how the run checks itself, "What's it allowed to touch? … a worktree, the one branch it may push to", "What stops it? `--max-turns`, `--max-budget-usd`, a spend limit", and who approves the merge [5]. It says "If something has to happen every time, make it a hook, a deny rule, or a managed setting. `CLAUDE.md` is for guidelines" [5]. Deny rules "block in every mode, including `bypassPermissions`", and that mode is for "isolated environments like containers, VMs, or dev containers without internet access" [3]. `--max-turns` and `--max-budget-usd` work in print mode only [2]. It also says to protect the default branch with a rule the run cannot bypass and to "watch the first few runs" [5].

**Task choice.** GitHub's guidance asks for "clear, well-scoped tasks", acceptance criteria and "Directions about which files need to be changed" [8]. It keeps for people "Production-critical issues" and "Tasks involving security, personally identifiable information, authentication repercussions" [8]. Copilot works from an assigned issue and asks for review "when it's finished" [9]: the assignment is the claim.

**What none of the pages read describes:** a file-overlap check against work that is not yet a PR, a dependency-aware lane of tasks, or a record of runs that produced nothing. Those are the parts this product must build. Path protection on the server is limited here: push rulesets that block file paths are described for "a private or internal repository" [15], and this repository is public [16]. Code-owner review needs a `CODEOWNERS` file on the base branch [14]; none exists.

## Current state in this codebase

Verified on `dev` at `fee835d8` on 2026-11-10; roadmap and specs read on `chore/docs-roadmap-wave2` at `22e24ca6`; the automations read on the VPS the same day.

- **The automations.** Orca runs `roadmap-matin`, `roadmap-midi` and `roadmap-soir` daily at 07:00, 11:00 and 19:00 UTC, each in a new worktree from `dev`, as `claude --dangerously-skip-permissions --model opus` in an interactive terminal session. The prompt says: read `CLAUDE.md`, `AGENTS.md` and `docs/product/roadmap.md`; pick one small unchecked Now or Next item; check `git log origin/dev -30` and `gh pr list --state all --limit 40`; TDD; no migration, new service or secret; never merge; never edit the changelog, progress or roadmap; never set `SKIP_E2E`; fix root-owned test results with `sudo chown`; remove the worktree after the PR. The `sudo` line predates #1302, which clears those files through a container. Bypass mode is the one Anthropic reserves for isolated environments without internet access [3]; here it runs on the owner's VPS with the owner's GitHub login.
- **The precheck** (`~/bin/mab-automation-precheck`, outside the repository) runs the reaper, then skips a run when a salvage job is running, a `PAUSE` file exists, free disk is under 12 GB, open PRs cannot be read, or 4 PRs into `dev` with `roadmap-` in their head branch are open. The runs of 2026-11-08 pushed heads such as `fix/bracket-warning-unique-names-20261108`, which that filter does not count. Local branches are invisible to it.
- **The reaper** (`~/bin/mab-worktree-reaper`) removes an `auto-*` worktree once it is clean and pushed, keeps any worktree a live process uses, and kills sessions whose directory was deleted. Worktrees measure 1.4 to 1.6 GB. Free disk fell from 45 GB on 2026-11-07 to 25 GB on 2026-11-10; the repository has 40 worktrees on the machine.
- **Run history** (Orca's run list and the session transcripts):

| Run (UTC)                  | PR    | Output tokens | Minutes to last message | Outcome                                                                                     |
| -------------------------- | ----- | ------------: | ----------------------: | ------------------------------------------------------------------------------------------- |
| midi 1, 11-07 23:06 manual | #1285 |           24k |                      17 | Merged                                                                                      |
| midi 2, 11-08 11:00        | #1292 |           36k |                      23 | Merged                                                                                      |
| soir 1, 11-08 19:00        | #1295 |           30k |                      18 | Merged                                                                                      |
| matin 1, 11-09 07:00       | #1297 |          122k |                      19 | Merged                                                                                      |
| midi 3, 11-09 11:00        | none  |          278k |                      91 | E2E collision, memory stop, `sudo chown`; superseded by #1324                               |
| soir 2, 11-09 19:00        | #1309 |           80k |                      17 | Merged                                                                                      |
| matin 2, 11-10 07:00       | #1326 |          146k |                      78 | Merged; conflicts with queued `fix/official-bracket-definitions` on `src/lib/deck/store.ts` |
| midi 4, 11-10 11:00        | #1327 |           66k |                      16 | Merged; duplicates `x-default` on queued `fix/localized-page-metadata`                      |

The seven PRs added 31 to 335 lines in 3 or 4 files. None was a draft. Midi 3's session was still alive at 29 hours (268 MB), so the reaper kept its worktree.

- **What the runs read.** `origin/dev`'s roadmap holds 37 initiatives and 238 unchecked items, last changed 2026-11-09. The docs branch holds 71 initiatives and 588 unchecked items, 20 commits ahead, and is not on `origin`. Neither the prompt nor `gh pr list` sees the 15 queued local branches.
- **Slice metadata.** 61 tables in 60 specs share one header, `| # | Slice | Depends on |`, with 747 rows. Cells are free text ("I-63 slice 5 if the runner is the job route"). "Must not pick" sentences sit in prose after the table in 15 specs and in the roadmap's delivery-order paragraphs. No column says migration, external service, files or size.
- **The generators** live outside the repository. `depgraph.py` (1,066 lines of Python) parses the tables and the roadmap with 76 regular-expression calls and 69 hand-kept entries (35 start-now claims, 11 ignored findings, 8 in-flight branches, 7 moved slices, 5 verdicts, 2 shipped slices, 1 gate); on 2026-11-10 it could not parse 6 rows. `gen_page.py` renders the start-now table and the Mermaid graph; `glance.py` renders the glance table and loads its helpers by executing `gen_page.py`'s source. **The ready lane has no generator**: its 25 rows are hard-coded in a one-off patch script from a hand analysis.
- **"Can start now" is not "safe alone".** 83 slices have no unmet dependency; the lane keeps 25. The glance table's "first slice that can start now" names migrations: I-15 slice 1, I-17 slice 1, I-35 slice 1, I-43 slice 1 and I-51 slice 1. A run that read it as a to-do list would pick a migration.
- **Repository support.** Vitest includes `scripts/**/*.test.ts`; `tsx`, `zod` and `prettier` are installed; no YAML parser is a direct dependency. `.claude/settings.json` already runs a deterministic `PreToolUse` command hook, [`scripts/pre-pr-sonar-gate.sh`](../../../scripts/pre-pr-sonar-gate.sh). lint-staged formats `*.json` and `*.md` with prettier on commit.
- **Cleanup hazard.** [`CLAUDE.md`](../../../CLAUDE.md) recommends [`scripts/git-prune.sh`](../../../scripts/git-prune.sh) for cleanup. It force-removes every other worktree and deletes every local and remote branch outside its protected list, so one run that used it would delete the queue and the other runs' worktrees.
- **GitHub.** The repository is public. `dev` and `staging` have no protection; `main` requires "Lint, Typecheck, Test, Build", with admins included. There are no rulesets and no `CODEOWNERS`. Runs push and open PRs as the owner's account, so nothing on the server stops a run from merging or from pushing to `dev` [16].
- **Pre-push.** [`scripts/e2e-pre-push.sh`](../../../scripts/e2e-pre-push.sh) runs the whole Playwright suite in Docker behind a machine-wide lock (#1302); [`quality-gate.md`](../../engineering/quality-gate.md) budgeted it at about 3.5 minutes when it was measured on 2026-08-22. Every push pays it.

## Functional requirements

### 1. One slice registry

1.1 Each spec has one JSON file, `docs/product/slices/iNN.json`, holding its slices. The spec's "Delivery slices" table is generated from it between `<!-- slices:start -->` and `<!-- slices:end -->`. Nobody edits the table by hand.
1.2 Each slice entry has: `id` (`I-67/1`, a letter suffix for parts: `I-63/1a`), `title`, `tier` (Now, Next, Later or Parked), `dependsOn` (slice ids; an `anyOf` group for "or"), `decisions` (D-xx), `legal` (L-xx), `ownerTask`, `migration`, `externalService` (null, provider, secret, cron or spend), `size` (S, M or L), `likelyFiles` (globs), `unattended` (`allowed`, `never` with a reason, or `after` with a condition), `status` (open, shipped or moved), `shippedIn` (PR numbers), `movedTo`, `doneMeans` and `specAnchor`.
1.3 `docs/product/slices/gates.json` lists every D-xx and L-xx with `open` or `answered` (date and link). `initiatives.json` holds each initiative's short name. Initiative tiers stay in the roadmap's Portfolio View, whose `### Now` headings and numbered `**I-NN` lines are a strict grammar.
1.4 Validation fails on: a dependency on an unknown id; a cycle; a D-xx or L-xx missing from `gates.json`; a shipped slice with no PR number; `unattended: allowed` together with a migration, an external service, an open gate, an owner task, size L or no `likelyFiles`.
1.5 A slice is **ready** when it is open, every dependency is shipped (one member of an `anyOf` group suffices), every gate is answered and it is not an owner task. It is **unattended-ready** when it is also `allowed`, has no migration and no external service, and is size S. Size S means at most about 400 changed lines in at most 8 files (**estimate**, from the seven run PRs: 31 to 335 lines, 3 or 4 files).
1.6 Part-slices become lettered slices with their own fields. No "(part)" text remains.
1.7 **Migration.** A one-time conversion moves the 61 tables into the registry. A person reviews the 6 unparsed rows, the two-owner findings and every "must not pick" sentence, which becomes an `unattended` value. The converted graph gives the same 83 ready slices and the same 25-slice lane as the scripts on the same commit, or the PR lists each difference and its reason.

**Registry options compared.**

| Option                                  | One source                                              | Readers                                         | Merge conflicts                         | Parser                                            | Verdict         |
| --------------------------------------- | ------------------------------------------------------- | ----------------------------------------------- | --------------------------------------- | ------------------------------------------------- | --------------- |
| Front matter in each spec (YAML)        | Yes                                                     | The table must still be generated into the body | Low, one file per spec                  | A new YAML dependency                             | Second choice   |
| One registry file (YAML or JSON)        | Yes                                                     | Poor: 747 entries in one file                   | High: every docs PR edits the same file | None for JSON; a dependency for YAML              | No              |
| One JSON file per spec, table generated | Yes, with the stale check (2.3)                         | Unchanged: the spec table stays                 | Low, one file per spec                  | `JSON.parse` and `zod`, both available            | **Recommended** |
| Parse today's tables                    | Only while 76 regular expressions and 69 overrides hold | Best                                            | Low                                     | Free text; no column for migration, files or size | No              |

### 2. Generated sections and the stale check

2.1 `scripts/roadmap/` holds the registry loader, the graph, the renderers and a CLI, in TypeScript under the repository's rules. The core is pure; files, git and `gh` sit behind small adapters.
2.2 The renderers write the glance table, the ready lane, the dependency page (counts, start-now table, Mermaid graph) and every spec's slice table. Output passes through the repository's prettier configuration, so a regenerated file equals the committed one byte for byte.
2.3 `pnpm roadmap:check` runs in `ci.yml` on every PR. It fails, naming the section and the first differing line, when a generated section differs from what the registry produces, or when 1.4 fails. It needs no network.
2.4 Markers: `glance` (exists), `lane`, `depgraph:counts`, `depgraph:start-now`, `depgraph:graph` and `slices`. Text outside the markers stays hand-written.
2.5 After the migration, no script reads a free-text "Depends on" cell or a prose sentence. A spec whose "Delivery slices" table sits outside markers fails the check.

### 3. Choosing and claiming a slice

3.1 At start, a run computes the **live lane** on `origin/dev`: unattended-ready slices, minus slices whose merged PR carries `Slice: <id>`, minus slices claimed by an open PR (draft or not) with that line, minus overlaps (3.2). It never reads a roadmap copy from another branch.
3.2 **Overlap.** A candidate is skipped when its `likelyFiles` match a file changed by: an open PR into `dev`, or the `Likely files:` line of a draft claim with no commit yet; or a local or remote branch committed in the last 14 days (**estimate**) that is not the head of a merged PR, compared with `git diff --name-only origin/dev...<branch>`. Rebased merges make `--no-merged` useless here. The record names the branch or PR. This check flags both collisions of 2026-11-10: #1327 and `fix/localized-page-metadata` both change `src/lib/seo/alternates.ts`, and #1326 and `fix/official-bracket-definitions` both change `src/lib/deck/store.ts`.
3.3 The run takes the highest-ranked remaining slice: tier first, then the count of slices that wait on it, then id. With none left, it records `no-safe-item` and stops with no branch and no PR.
3.4 **Claim before code.** The run commits an empty `chore(claim): I-NN/S <title>`, pushes its branch and opens a draft PR into `dev` titled `I-NN/S: <title> (automated, in progress)`, with the lines `Slice: I-NN/S`, `Run: <automation> <number>` and `Likely files: …`.
3.5 **Race.** If an older open PR carries the same `Slice:` line, the run closes its own draft, deletes its own branch, records `lost-claim` and picks again, once.
3.6 **Empty pushes skip the E2E gate.** `scripts/e2e-pre-push.sh` skips the suite, and says why, when every commit being pushed changes no file. Any file change runs the full gate as today. Runs still never set `SKIP_E2E` or `--no-verify`.
3.7 **Finish.** The run marks the PR ready (`gh pr ready`) only after the gate passed and the body records the Red failure and the verification, as the TDD contract requires. Draft means in progress or stopped.
3.8 **After each merge** into `dev`, a workflow recomputes the live lane and writes it to the job summary. It commits nothing.
3.9 Work queued by hand is pushed as a draft PR with a `Slice:` line, so every claim sits in one place. 3.2's branch check stays as the backstop.

### 4. Budget, record and cleanup

4.1 **Caps.** A run stops at 75 minutes or 200,000 output tokens (**estimates**: finished runs took 16 to 78 minutes and 24k to 146k output tokens; the wasted run took 91 minutes and 278k). Interactive sessions cannot use `--max-turns` or `--max-budget-usd` [2], so either the automation runs in print mode with `--max-turns`, or a watchdog reads elapsed time and the transcript's usage and stops the session (open question 3).
4.2 **At a cap** the run, or the watchdog, saves unpushed commits as `~/.mab-automation/salvage/<run>.bundle`, comments on its draft claim, leaves it a draft, records `stopped-budget` and removes the worktree.
4.3 **Record.** Each run appends one JSON line to `~/.mab-automation/runs.jsonl`, outside the repository, with the schema in `scripts/roadmap/run-record.ts` (Data model).
4.4 **Cleanup.** A run removes only the worktree and branch it created, after the PR is ready or after 4.2. The reaper also stops a session 30 minutes past the cap; today it keeps a worktree as long as any process uses it. Runs never call `scripts/git-prune.sh` and never delete another branch, worktree or PR.
4.5 **Precheck.** It counts open PRs into `dev` whose head starts with `KaelSensei/auto-`, drafts included, and skips at 4. A floor on available memory is D-22's to choose; the recommended start is 3 GiB (**estimate**: 7.6 GiB total, and midi 3 was stopped for memory).

### 5. What a run may never do

5.1 The list:

| Area                   | Forbidden                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema                 | Changing `prisma/schema.prisma` or `prisma/migrations/**`; `prisma migrate`, `prisma db push`                                                                                                               |
| Secrets and services   | `.env*` files, a new name in `.env.example`, `vercel.json`, a new provider, a cron                                                                                                                          |
| Gates and instructions | `.github/**`, `.husky/**`, `.claude/**`, `.agents/**`, `scripts/e2e-pre-push.sh`, `scripts/roadmap/**`, `CLAUDE.md`, `AGENTS.md`, `CODEX.md`                                                                |
| Dependencies           | `package.json` dependency blocks, `pnpm-lock.yaml`                                                                                                                                                          |
| Protected docs         | `docs/project/changelog.md`, `docs/project/progress.md`, `docs/product/roadmap.md`, `docs/product/slices/**`, `docs/product/specs/**`, `docs/product/owner-decisions.md`, `docs/product/legal-questions.md` |
| Git and GitHub         | `gh pr merge`; a push to `dev`, `staging` or `main`; a force-push or delete on a branch it did not create; closing or editing a PR it did not open; `--no-verify`; `SKIP_E2E`; `sudo`; `git-prune.sh`       |
| Choice                 | A slice outside the live lane, or one whose `unattended` is not `allowed`                                                                                                                                   |

5.2 **Three layers, none of them the prompt.** (a) A run-only settings file, passed by the automation with `--settings`, holds deny rules, which hold in `bypassPermissions` [3], and a `PreToolUse` command hook that exits 2 on any forbidden command or path, as `pre-pr-sonar-gate.sh` already does. (b) A CI job, "Unattended run guard", fails a PR whose head starts with `KaelSensei/auto-` when its diff touches a forbidden path, when its body has no `Slice:` line or more than one, or when that slice is not unattended-ready at the PR's base. It passes every other PR, so it can be required; a PR that deletes the job then cannot merge, because the required check never reports. (c) The owner protects `dev`: a PR is required and the guard is a required check (slice 0).
5.3 When a slice turns out to need something forbidden, such as a dependency, the run stops, comments on its draft, records `needs-human` and leaves the draft for the owner.

### 6. Protected docs and generated sections

6.1 Only `chore/docs*` branches change the registry, `gates.json` or a generated section. They run `pnpm roadmap:generate` in the same commit, so the stale check passes.
6.2 Feature PRs, by a person or a run, touch none of them. Their stale check compares an unchanged registry with unchanged sections and passes.
6.3 **Shipped status.** Every feature PR carries `Slice: I-NN/S`. After each merge batch, the `chore/docs` PR runs `pnpm roadmap:sync-shipped`, which marks those slices shipped with their PR numbers, then regenerates. Between two docs PRs, the live lane (3.1) already leaves merged slices out.
6.4 A spec writer edits the JSON, never the generated table.
6.5 `CLAUDE.md`'s protected-docs line gains the registry and the generated sections. `CLAUDE.md` is the owner's to change (slice 0).

### 7. Weekly summary of wasted runs

7.1 A run is **wasted** when it ends `no-push`, `stopped-budget`, `gate-failed`, `duplicate`, `conflict-closed`, `already-shipped` or `lost-claim` after work began. `no-safe-item` is correct behaviour, reported but not wasted.
7.2 Every Monday before the 07:00 run, a job on the VPS writes `~/.mab-automation/weekly/<ISO week>.md`: runs, PRs opened, merged and still draft; wasted runs by reason with their minutes and output tokens; candidates skipped for overlap, with the branch or PR; drafts with no commit for 72 hours; precheck skips by reason; the lane's size at the start and end of the week.
7.3 Where the summary is published, beyond the file, is open question 5.

### 8. Free and paid

8.1 Nothing here reaches players, and nothing is sold. It protects the pace of everything the paid tier ([I-30](i30-business-model-and-paid-tier.md)) needs built.
8.2 **What it saves, per week (estimate).** 21 scheduled runs a week. In the eight runs observed, three needed the owner: one wasted run, two collisions. At that rate about 8 runs a week need repair; at 20 minutes each that is about 2.7 hours. Rebuilding and checking the lane by hand after each merge batch, two or three times a week, takes about 30 to 60 minutes each, 1 to 3 hours. Total: about 4 to 6 hours of the owner's week. At the observed rate it also saves about a third of the output tokens the runs spend (the wasted run used 36% of all eight runs' output tokens).

## Data model / API

```
docs/product/slices/i67.json
[{ "id": "I-67/1", "title": "Bulk reader behind CardSource", "tier": "Next",
   "dependsOn": [], "decisions": [], "legal": [], "ownerTask": false,
   "migration": false, "externalService": null, "size": "S",
   "likelyFiles": ["src/lib/card-data/**"], "unattended": "allowed",
   "status": "open", "shippedIn": [], "doneMeans": "Reads /bulk-data; …",
   "specAnchor": "i67-one-card-data-pipeline.md#2-sources-and-cadence" }]
  -- dependsOn item: "I-63/5" or { "anyOf": ["I-61/10", "I-61/11"] }
  -- unattended: "allowed" | { "never": reason } | { "after": condition }

docs/product/slices/gates.json   { "D-04": { "open": true }, "L-13": { "answered": "YYYY-MM-DD", "link": "…" } }

~/.mab-automation/runs.jsonl (one line per run)
{ runId, automation, trigger, startedAt, endedAt, baseSha, laneSize,
  skipped: [{ slice, reason, by }], picked, claimPr, finalPr,
  outcome: pr-ready | no-safe-item | no-push | stopped-budget | gate-failed | duplicate
         | conflict-closed | already-shipped | lost-claim | needs-human,
  wasted: boolean, outputTokens, cacheReadTokens, minutes, worktreeBytes, e2eMinutes }
```

Commands: `pnpm roadmap:generate`, `pnpm roadmap:check`, `pnpm roadmap:lane [--live] [--json]`, `pnpm roadmap:sync-shipped`. PR lines: `Slice:`, `Run:`, `Likely files:`. Files: `scripts/roadmap/**`, `scripts/roadmap/unattended-settings.json`, `scripts/roadmap/run-guard.sh`, `.github/workflows/roadmap-lane.yml`, `docs/engineering/unattended-runs.md`.

## Non-goals

- Deciding the VPS capacity (D-22), or moving the runs to the cloud; open question 2 feeds D-22.
- A run that merges, approves or enables auto-merge, at any size.
- A project-management tool (GitHub Projects, Linear, Jira) as the source of slices.
- A model deciding whether a slice is ready or safe. Readiness is the deterministic rule in 1.5; a model only writes the code.
- Judging the quality of a run's code. Review stays with the owner, CI and SonarCloud.
- Changing the TDD contract, the E2E suite or the branch flow.

## Testing strategy

- **Registry (solitary):** one failing fixture per rule in 1.4; a valid fixture passes.
- **Graph (solitary):** readiness with `anyOf`, gates and owner tasks; dependent counts; a frozen snapshot of 2026-11-10 (83 ready, the 25-slice lane) recorded during the migration.
- **Renderers (golden):** fixture registry to expected Markdown after prettier; the check fails on a one-byte change inside a marker and ignores text outside.
- **Live lane (sociable, fake git and `gh`):** replays #1327 against a queued branch touching `src/lib/seo/alternates.ts` and #1326 against one touching `src/lib/deck/store.ts`, and both are skipped; a draft claim with no commit blocks its slice through `Likely files:`; a merged PR with `Slice:` removes its slice; a head of a merged PR is ignored.
- **Pre-push:** the existing fake-`docker` harness in `scripts/e2e-pre-push.test.ts`: an empty commit never calls `docker`; a one-byte change does.
- **Run guard hook:** tool inputs on stdin for `gh pr merge 1`, `git push origin dev`, `git push --no-verify`, `SKIP_E2E=1 git push`, `sudo chown`, `bash scripts/git-prune.sh`, `npx prisma migrate dev` and an edit of `docs/product/roadmap.md` exit 2; `pnpm test` exits 0.
- **CI guard:** diff fixtures for each forbidden area; a non-automation head passes.
- **Run record:** a fixture transcript sums to known token counts; the outcome table maps to `wasted`.
- **Manual:** the owner watches the first week of runs under the new protocol, as [5] advises.

## Delivery slices

| #   | Slice                                                                                                                                                               | Depends on                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 0   | Owner decisions: registry format, the forbidden list and the `CLAUDE.md` line, `dev` protection with the guard required, run caps, where records and the summary go | — (owner; no code)                   |
| 1   | Slice model, `zod` schema, validation rules and graph (readiness, `anyOf`, dependent counts) on fixtures                                                            | —                                    |
| 2   | Migration of the 61 tables into `docs/product/slices/`, `gates.json` and `initiatives.json`, with the parity report                                                 | 0, 1                                 |
| 3   | Renderers for the glance table, the lane, the dependency page and spec tables, with golden tests                                                                    | 1                                    |
| 4   | `roadmap:generate`, `roadmap:check`, the markers and the CI step                                                                                                    | 2, 3                                 |
| 5   | Live lane: shipped, claimed and overlap filters with `git` and `gh` adapters                                                                                        | 1                                    |
| 6   | The pre-push gate skips a push that changes no file                                                                                                                 | —                                    |
| 7   | Run-only settings: deny rules and the `PreToolUse` run guard                                                                                                        | 0                                    |
| 8   | CI job "Unattended run guard"                                                                                                                                       | 2, 7                                 |
| 9   | Run record, transcript token reader, budget watchdog and salvage bundle                                                                                             | 0                                    |
| 10  | `docs/engineering/unattended-runs.md` with the canonical prompt, the precheck and reaper rules; the owner applies them to the three automations                     | 4, 5, 6, 7, 9                        |
| 11  | Workflow that recomputes the live lane after each merge into `dev`                                                                                                  | 5                                    |
| 12  | Weekly summary of wasted runs                                                                                                                                       | 9                                    |
| 13  | Owner makes the guard a required check on `dev` and pushes queued branches as draft PRs                                                                             | 8 (owner; no code)                   |
| 14  | Retire the outside scripts; the dependency page's method and the specs README name the registry                                                                     | 4                                    |
| 15  | Size calibration: let runs take size M slices if the records support it                                                                                             | 12 (after four weeks of run records) |

Scheduled agents must not pick slices 0 to 15: each changes the rules, gates or records that judge the runs, or is the owner's. Slices 1, 3, 5 and 6 need no decision and can start now by hand; slice 2 waits only for slice 0's choice of format.

## Open questions

1. **Registry format ([D-85](../owner-decisions.md#infrastructure-and-providers)).** One JSON file per spec (recommended: no new dependency, `zod` validates it) or YAML front matter in each spec (easier to edit by hand, needs a YAML parser)? Slice 0.
2. **Where the runs execute.** Cloud scheduled tasks push to `claude/` branches, cap at 100 runs an hour and use no VPS memory, but are a research preview [4]; GitHub Actions disables a schedule in a public repository after 60 days without activity [1]. Neither runs the Docker E2E gate, and CI has no E2E job yet (I-05). Does this join D-22? (It does: D-22 lists it as an option since 2026-11-10.)
3. **Enforcing the caps ([D-86](../owner-decisions.md#infrastructure-and-providers)).** Switch the automations to print mode with `--max-turns`, which Orca's terminal sessions do not use today, or keep interactive sessions and add a watchdog?
4. **Overlap window.** Is 14 days right for local branches, or 72 hours as the wave 9 lane used? A longer window skips more slices; a shorter one misses older queued work.
5. **Publishing records.** Keep run records and the weekly summary on the VPS, or post the summary to a pinned issue in this public repository? Records hold slice ids, outcomes and token counts, never transcripts.
6. **Lane order.** The current lane ranks by dependent count before tier, which put a Later slice (I-21 slice 1) third. Keep that, or rank tier first as 3.3 proposes?
7. **Protecting `dev` ([D-87](../owner-decisions.md#d-87-protect-dev-and-staging)).** If the rule includes administrators, as `main`'s does, it also applies to the owner's own docs merges into `dev`. Include administrators, or let the owner bypass it?

## Sources

All read on 2026-11-10. None of the pages shows a last-updated date.

1. Claude Code docs, [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions).
2. Claude Code docs, [CLI reference](https://code.claude.com/docs/en/cli-reference) (`--max-turns`, `--max-budget-usd`, `--disallowedTools`, `--dangerously-skip-permissions`).
3. Claude Code docs, [Permission modes](https://code.claude.com/docs/en/permission-modes).
4. Claude Code docs, [Automate work with scheduled tasks](https://code.claude.com/docs/en/routines) (formerly routines; research preview).
5. Claude Code docs, [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices), "Let Claude run without you" and "Enforce the rules that can't have exceptions".
6. GitHub Docs, [Risks and mitigations for GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations).
7. GitHub Docs, [About GitHub Copilot cloud agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent).
8. GitHub Docs, [Get the best results from Copilot cloud agent](https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results).
9. GitHub Docs, [Use Copilot cloud agent on GitHub](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github) (public preview).
10. GitHub Agentic Workflows, [Safe Outputs (Pull Requests)](https://github.github.com/gh-aw/reference/safe-outputs-pull-requests/).
11. Renovate, [Configuration options](https://docs.renovatebot.com/configuration-options/) (`prConcurrentLimit`, `prHourlyLimit`, `branchConcurrentLimit`).
12. GitHub Docs, [Dependabot options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference) (`open-pull-requests-limit`).
13. GitHub Docs, [About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) (draft pull requests).
14. GitHub Docs, [About code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
15. GitHub Docs, [About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).
16. GitHub REST API for `KaelSensei/MagicAIBuilder`: repository visibility, branch protection of `dev`, `staging` and `main`, rulesets, `CODEOWNERS`, and authors of PRs #1285 to #1327.

## Feature contract (Full, 2026-11-11)

The roadmap entry is a link. This section is the player contract. The engineering slices above, if this file already had them, stay the build plan.

### Summary and problem

each scheduled run picks a slice from a lane computed on `origin/dev`, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

### Goals

- A scheduled run started from `origin/dev` picks a slice from the generated lane, skips one whose files a queued branch changes, opens a draft claim before writing code and stops at its cap with a salvage bundle; and it cannot merge, push to `dev` or edit this roadmap, because a deny rule, a hook and a required CI check each refuse it.

### Non-goals

- Do not reverse a non-goal already named in the moved record or in the roadmap's strategic boundaries.
- Do not invent a usage count, a win rate, or a score the moved record does not already cite from a named source.

### Personas

See the roadmap persona table. This initiative serves the rows that list its id.

### User stories

#### US-74-01

As an agent picking work, I want the glance table and the dependency page generated from one registry, so that a hand-edited row cannot drift.

#### US-74-02

As a signed-out player, I want the guest rule in the rollout to be true, so that I am not shown a control that fails when I have no account.

#### US-74-03

As a player using a keyboard or a screen reader, I want the primary action to have a name and a visible focus, so that colour is not the only signal.

### Acceptance criteria

#### AC-74-01 Happy path

Given a signed-in player and the English locale
When a slice in the registry appears in the glance table and the dependency page.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-74-02 Happy path

Given a signed-in player and the English locale
When a stale generated section fails CI.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-74-03 Happy path

Given a signed-in player and the English locale
When a scheduled run does not pick a slice that touches the rules of the run.
Then that outcome holds, and the French locale shows the French catalogue string for every new control

#### AC-74-04 Error and failure

Given the action cannot finish
When the player retries or leaves the screen
Then the last confirmed state is unchanged, and the message is a catalogue string rather than a stack trace or a raw status code

#### AC-74-05 Edge cases

Given an empty deck, a missing price, or a field the record says may be absent
When the screen renders
Then the empty state says what is missing, and it does not show a zero in place of an unknown value

#### AC-74-06 Guest and signed-in

Given the rollout in this contract
When a guest and a signed-in player open the same surface
Then the rollout holds: Internal. No player flag. Agents pick none of this initiative's own slices.

#### AC-74-07 Locales

Given the ten catalogs
When this feature adds a user-facing string
Then The ten catalogs on disk are `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` (`src/i18n/routing.ts`). Only `en` and `fr` are routed. The other eight stay at key parity with `en` and may reuse the English text until a person who speaks the language reviews them. A new string is not shipped in a routed locale as hard-coded English.

#### AC-74-08 Accessibility

Given a keyboard, a visible focus, and a screen reader
When the player completes US-74-01 without a pointer
Then every new control has an accessible name, focus returns on close, and a status uses a word or an icon as well as colour

### UX flow and states

Players do not see this. The registry is a file a reviewer can read.

- Empty: the screen says what is missing and what to do next.
- Loading: a busy state that does not shift the layout when it ends.
- Error: the catalogue message and a way to retry, without losing the last confirmed edit.

### Data model and API

A schema for slices. Generation writes between markers. I-80 to I-98, which have no spec, stay hand-written until they have slices.

### Analytics and telemetry

`roadmap_check_failed {reason: stale or overlap}`. Reserved for I-39. Not emitted before that store exists.

The event is reserved for I-39's store. It is not emitted before that store exists. The row holds counts and enums only: no email, name, username, deck name, card name, list, search text or URL.

### Rollout and feature flags

Internal. No player flag. Agents pick none of this initiative's own slices.

### Dependencies

Hard waits are in the roadmap dependency table. Slice edges, where this file has a delivery-slice table, stay in that table and in `dependency-graph.md`.

### Risks and mitigations

- Shipping the surface before its wait is met: the roadmap sequence forbids the pick.
- A string or a status that only some players can read: the locale and accessibility scenarios above fail the change.

### Kill criteria

None. This initiative is not in the Now band. Stop it if it would reverse a non-goal in the moved record.

### Open questions

The registry format is D-85. Protecting `dev` and `staging` is D-87 and needs no code.

### Sources

- https://code.claude.com/docs/en/best-practices

## Expanded scenarios

These scenarios are added. They do not replace the contract above or the moved record below. Each one is a scope line from that record, written out as a story and as Given/When/Then, including the failure and the edge case.

#### US-74-101

As a player, I want the product to slice 0, the owner's: the registry format (D-85), how the caps are enforced, with the forbidden list, the CLAUDE.md line and where run records go (D-86), and protecting dev with the guard as a required check (D-87)., so that each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

#### AC-74-100 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Slice 0, the owner's: the registry format (D-85), how the caps are enforced, with the forbidden list, the CLAUDE.md line and where run records go (D-86), and protecting dev with the guard as a required check (D-87).

#### AC-74-101 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-74-102 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-74-102

As a player, I want **Owner actions, found 2026-11-10.** The precheck and the run prompt live on the VPS, outside the repository, and CLAUDE.md is the owner's to change., so that each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

#### AC-74-103 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then **Owner actions, found 2026-11-10.** The precheck and the run prompt live on the VPS, outside the repository, and CLAUDE.md is the owner's to change. The precheck (~/bin/mab-automation-precheck) counts only open PRs whose head contains roadmap-, while the runs of 2026-11-08 pushed fix/bracket-warning-unique-names-20261108 and fix/card-add-command-pairing-20261108; done means it counts KaelSensei/auto- heads, drafts included (requirement 4.5). The run prompt still tells a run to fix root-owned test reports with sudo chown, which #1302 made unnecessary, since scripts/e2e-pre-push.sh now clears them through a container; done means the line is gone, since sudo is on the forbidden list. scripts/git-prune.sh, which CLAUDE.md recommends for cleanup, force-removes every other worktree and deletes every unprotected local and remote branch, so a run that used it would delete the queue and the other runs' worktrees; done means the prompt and the run guard forbid it and a run removes only what it created (requirement 4.4).

#### AC-74-104 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-74-105 Edge

Given the result of this behaviour
When the screen renders the words it is allowed to use
Then it does not call the deck fair, unfair, salty, or a win rate unless the moved record already quotes that phrase from a named source

#### US-74-103

As a player, I want the product to one JSON file of slices per spec in docs/product/slices/, validated with zod (slice 1); the migration of the 61 tables with a parity report against the scripts kept outside the repository (slice 2); renderers for the glance table, the lane, the dependency page and spec tables (slice 3); and pnpm roadmap:generate and roadmap:check in CI, so that a stale generated section fails its PR (slice 4)., so that each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

#### AC-74-106 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: One JSON file of slices per spec in docs/product/slices/, validated with zod (slice 1); the migration of the 61 tables with a parity report against the scripts kept outside the repository (slice 2); renderers for the glance table, the lane, the dependency page and spec tables (slice 3); and pnpm roadmap:generate and roadmap:check in CI, so that a stale generated section fails its PR (slice 4).

#### AC-74-107 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-74-108 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-74-104

As a player, I want the product to the run protocol: a live lane on origin/dev that drops shipped, claimed and overlapping slices (slice 5); an empty push that skips the E2E gate, so a claim costs nothing (slice 6); a run-only settings file with deny rules and a PreToolUse guard (slice 7), and a CI job, "Unattended run guard", for KaelSensei/auto- heads (slice 8); run records, a budget watchdog and a salvage bundle (slice 9); and docs/engineering/unattended-runs.md with the canonical prompt, which the owner applies to the three automations (slice 10)., so that each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

#### AC-74-109 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The run protocol: a live lane on origin/dev that drops shipped, claimed and overlapping slices (slice 5); an empty push that skips the E2E gate, so a claim costs nothing (slice 6); a run-only settings file with deny rules and a PreToolUse guard (slice 7), and a CI job, "Unattended run guard", for KaelSensei/auto- heads (slice 8); run records, a budget watchdog and a salvage bundle (slice 9); and docs/engineering/unattended-runs.md with the canonical prompt, which the owner applies to the three automations (slice 10).

#### AC-74-110 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-74-111 Edge

Given a card with no stored price
When the total is shown
Then the missing price is labelled unknown and is not shown as zero

#### US-74-105

As a player, I want the product to the lane recomputed after each merge into dev (slice 11), a weekly summary of wasted runs (slice 12), and the owner making the guard a required check on dev and pushing queued branches as draft PRs (slice 13)., so that each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

#### AC-74-112 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: The lane recomputed after each merge into dev (slice 11), a weekly summary of wasted runs (slice 12), and the owner making the guard a required check on dev and pushing queued branches as draft PRs (slice 13).

#### AC-74-113 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-74-114 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

#### US-74-106

As a player, I want the product to later: retire the outside scripts and name the registry on the dependency page (slice 14); let runs take size M slices if four weeks of records support it (slice 15)., so that each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

#### AC-74-115 Happy path

Given a signed-in player, the English locale, and the deck or screen this behaviour belongs to
When the player uses this behaviour
Then the behaviour holds: Later: retire the outside scripts and name the registry on the dependency page (slice 14); let runs take size M slices if four weeks of records support it (slice 15).

#### AC-74-116 Failure

Given the same starting point and the write or the upstream source fails
When the player retries or leaves
Then the last confirmed state is unchanged, nothing is half-written, and the message is a catalogue string rather than a stack trace

#### AC-74-117 Edge

Given an empty list and a missing optional field
When the screen renders
Then the player sees an empty state that names what is missing, and the page does not crash or invent a value

### UX states for this feature

The player-visible outcome is: each scheduled run picks a slice from a lane computed on origin/dev, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

| State | What the player sees |
| --- | --- |
| Empty | A sentence that names what is missing and the next action. No invented row, author, price or score. |
| Loading | A busy state that keeps the layout still. The previous confirmed content stays until the new content is ready. |
| Error | The catalogue message, what was not saved, and a retry. The last confirmed edit is still there. |
| Partial | Known rows are shown. Unknown rows are labelled unknown. A short list is not padded to look finished. |
| Stale | If this feature shows a date, the date is the one that was stored. A missing date is absent, not guessed. |
| Guest | A signed-out player sees only what the rollout allows. A control that needs an account explains that, and does not fail with a raw 401. |
| Signed-in | Writes go to that account only. Another player's notes, budget and collection are not in the response. |
| English | New controls use the `en` catalogue. |
| French | New controls use the `fr` catalogue. A French URL does not show a hard-coded English control. |
| Dormant catalogs | `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt` keep every new key and may reuse the English text until a person reviews them. They are not routed. |
| Keyboard | The primary action and every new control can be reached without a pointer. Focus is visible and returns when a dialog closes. |
| Screen reader | Each new control has an accessible name. A status change is announced in words, not only by colour. |
| Colour | A warning and an error differ by text or icon as well as hue, in both themes. |
| Success | The completed action is confirmed in words. A second identical action does not duplicate the write. |

### Alternate paths

- The player cancels before confirming. Nothing is written.
- The player confirms, the request fails, and they retry. The retry uses the last confirmed state, not a mixture of the failed attempt and the old one.
- The player switches locale in the middle of the flow. The draft they already typed is kept. Chrome strings switch. Card names and oracle text stay the printing's language.
- Two writes overlap. Each field rolls back to its own last confirmed value. One failure does not undo the other field's success.

### Record moved from the roadmap (2026-11-11)

Nothing in the roadmap entry was dropped. The section below is the initiative text as it stood, including scope lists, status notes and the earlier enrichment.

## I-74: A Roadmap Scheduled Agents Can Execute Safely

**Spec:** [`specs/i74-a-roadmap-agents-can-execute.md`](i74-a-roadmap-agents-can-execute.md)

**Outcome:** each scheduled run picks a slice from a lane computed on `origin/dev`, skips one whose files a queued branch or an open PR already changes, claims it with a draft PR before writing code, stops at a budget and leaves a record; the tables people read are generated from one slice registry and fail CI when stale; and what a run must never do is refused by deny rules, a hook and a required CI check, not by its prompt.

**Status:** Next
**Priority:** Next for slices 0 to 13, before any new automation slot is added; Later for slices 14 and 15. Scheduled agents pick none of its slices. Nothing in it is a paid feature
**Impact / effort:** High / medium
**Depends on:** nothing for slices 1 and 6; slice 1 for the renderers (slice 3) and the live lane (slice 5); the owner's registry format (slice 0) for the migration (slice 2); slices 2 and 3 for the generator and stale check (slice 4); slice 0 for the run guard (slice 7) and the run record and watchdog (slice 9); slices 2 and 7 for the CI guard (slice 8); slices 4, 5, 6, 7 and 9 for the canonical run protocol (slice 10); slice 5 for the lane after each merge (slice 11); slice 9 for the weekly summary (slice 12); slice 8 for the required check, which is the owner's (slice 13); slice 4 for retiring the outside scripts (slice 14); four weeks of run records for size calibration (slice 15).

Three scheduled runs a day pick one roadmap item and open one PR against `dev`. They work: from 2026-11-07 to 2026-11-10 eight runs opened seven PRs, and all seven merged (#1285, #1292, #1295, #1297, #1309, #1326, #1327). The failures cost more than the count suggests. The one run that pushed nothing used 36% of the eight runs' output tokens and was still alive 29 hours later, holding its worktree, and two runs collided with queued local branches, #1326 with `fix/official-bracket-definitions` on `src/lib/deck/store.ts` and #1327 with `fix/localized-page-metadata` on `src/lib/seo/alternates.ts`. The cause is what the runs read: `origin/dev`'s roadmap stops at I-37, slice metadata sits in free-text cells across 61 tables, the [lane](#ready-for-unattended-runs) is written by hand, claims exist only as open PRs, and every rule is a sentence in a prompt. GitHub's API shows that `dev` and `staging` have no protection while the runs act as the owner's account (2026-11-10). Anthropic's guidance for unattended runs says "If something has to happen every time, make it a hook, a deny rule, or a managed setting" ([best practices](https://code.claude.com/docs/en/best-practices)). I-05 keeps the VPS capacity decision ([D-22](../owner-decisions.md#infrastructure-and-providers)) and the E2E gate, and [I-71](i71-speed-uptime-and-recovery.md) the CI budgets and the guard on destructive commands.

### Scope

- [ ] Slice 0, the owner's: the registry format ([D-85](../owner-decisions.md#infrastructure-and-providers)), how the caps are enforced, with the forbidden list, the `CLAUDE.md` line and where run records go ([D-86](../owner-decisions.md#infrastructure-and-providers)), and protecting `dev` with the guard as a required check ([D-87](../owner-decisions.md#d-87-protect-dev-and-staging)).
- [ ] **Owner actions, found 2026-11-10.** The precheck and the run prompt live on the VPS, outside the repository, and `CLAUDE.md` is the owner's to change. The precheck (`~/bin/mab-automation-precheck`) counts only open PRs whose head contains `roadmap-`, while the runs of 2026-11-08 pushed `fix/bracket-warning-unique-names-20261108` and `fix/card-add-command-pairing-20261108`; done means it counts `KaelSensei/auto-` heads, drafts included (requirement 4.5). The run prompt still tells a run to fix root-owned test reports with `sudo chown`, which #1302 made unnecessary, since `scripts/e2e-pre-push.sh` now clears them through a container; done means the line is gone, since `sudo` is on the forbidden list. `scripts/git-prune.sh`, which [`CLAUDE.md`](../../CLAUDE.md) recommends for cleanup, force-removes every other worktree and deletes every unprotected local and remote branch, so a run that used it would delete the queue and the other runs' worktrees; done means the prompt and the run guard forbid it and a run removes only what it created (requirement 4.4).
- [ ] One JSON file of slices per spec in `docs/product/slices/`, validated with `zod` (slice 1); the migration of the 61 tables with a parity report against the scripts kept outside the repository (slice 2); renderers for the glance table, the lane, the dependency page and spec tables (slice 3); and `pnpm roadmap:generate` and `roadmap:check` in CI, so that a stale generated section fails its PR (slice 4).
- [ ] The run protocol: a live lane on `origin/dev` that drops shipped, claimed and overlapping slices (slice 5); an empty push that skips the E2E gate, so a claim costs nothing (slice 6); a run-only settings file with deny rules and a `PreToolUse` guard (slice 7), and a CI job, "Unattended run guard", for `KaelSensei/auto-` heads (slice 8); run records, a budget watchdog and a salvage bundle (slice 9); and `docs/engineering/unattended-runs.md` with the canonical prompt, which the owner applies to the three automations (slice 10).
- [ ] The lane recomputed after each merge into `dev` (slice 11), a weekly summary of wasted runs (slice 12), and the owner making the guard a required check on `dev` and pushing queued branches as draft PRs (slice 13).
- [ ] Later: retire the outside scripts and name the registry on the dependency page (slice 14); let runs take size M slices if four weeks of records support it (slice 15).

### Engineering enablers

- One failing fixture per validation rule, and a frozen snapshot of 2026-11-10 that gives the same ready slices and lane as the outside scripts on the same commit.
- A one-byte change inside a generated section fails `roadmap:check`; text outside the markers is ignored.
- Replaying #1327 against a queued branch that changes `src/lib/seo/alternates.ts`, and #1326 against one that changes `src/lib/deck/store.ts`, skips both.
- The run guard exits 2 on `gh pr merge`, a push to `dev`, `--no-verify`, `SKIP_E2E`, `sudo`, `git-prune.sh`, `prisma migrate` and an edit of this roadmap, and lets `pnpm test` through.

**Paid-tier angle:** none; nothing reaches players. Its value is the owner's week: at the observed rate of three runs in eight needing repair, about 8 of the 21 weekly runs, plus rebuilding the lane by hand after each merge batch, the spec estimates 4 to 6 hours a week, and a third of the runs' output tokens.

### Enrichment (2026-11-11)

**User story.** As an agent picking work, I want the glance table and the dependency page generated from one registry, so that a hand-edited row cannot drift.

**Acceptance.**
- A slice in the registry appears in the glance table and the dependency page.
- A stale generated section fails CI.
- A scheduled run does not pick a slice that touches the rules of the run.

**UX.** Players do not see this. The registry is a file a reviewer can read.

**Data and API.** A schema for slices. Generation writes between markers. I-80 to I-98, which have no spec, stay hand-written until they have slices.

**i18n and access.** English and French chrome through the message catalogues. Card text stays the printing's language. New controls have an accessible name and a keyboard path, and a status is not colour alone.

**Telemetry.** `roadmap_check_failed {reason: stale or overlap}`. Reserved for I-39. Not emitted before that store exists.

**Rollout.** Internal. No player flag. Agents pick none of this initiative's own slices.

**Open questions.** The registry format is D-85. Protecting `dev` and `staging` is D-87 and needs no code.

### Definition of done

A scheduled run started from `origin/dev` picks a slice from the generated lane, skips one whose files a queued branch changes, opens a draft claim before writing code and stops at its cap with a salvage bundle; and it cannot merge, push to `dev` or edit this roadmap, because a deny rule, a hook and a required CI check each refuse it.

---


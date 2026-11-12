# Move codemod

`pnpm refactor:apply-moves` moves files and folders listed in [`moves.json`](moves.json) and
rewrites every reference to them. It is how the clean-code migration moves code into
`src/modules/<context>/` ([architecture.md, migration approach](../../docs/engineering/architecture.md#migration-approach),
[ADR 0001](../../docs/adr/0001-modular-monolith-by-bounded-context.md)). Never move a module by
hand: append it to the map and run the codemod.

## Usage

```bash
pnpm refactor:apply-moves --dry-run   # print the plan; write nothing
pnpm refactor:apply-moves             # apply it
```

It runs from anywhere in the repository and is idempotent: a second run changes nothing, and a
move already applied is skipped.

| Exit code | Meaning                                                                                                  |
| --------- | -------------------------------------------------------------------------------------------------------- |
| 0         | Done, or nothing to do                                                                                   |
| 1         | A module specifier resolves to no file (listed as `file:line "specifier"`). Nothing was written          |
| 2         | Invalid command line or move map, or a map that cannot be applied (two moves claim one destination, ...) |

## The move map

An ordered JSON list of `{ "from": "...", "to": "..." }`, each a file or a folder, POSIX and relative
to the repository root. A move pull request **appends** its entries; their `from` and `to` are never
edited, and entries are never removed, because branches still in flight re-run the map after a
rebase.

An entry may add `"shim": true` while a temporary re-export shim stays at `from` (see
[Temporary shims and the migration guard](#temporary-shims-and-the-migration-guard)). The mark is the
one field that changes: the series' closing pull request deletes the shim and removes the mark, which
changes no move.

- A folder entry moves every file git lists under it (tracked, or untracked and not ignored).
- A later entry may move an earlier destination further (a chain).
- A destination may not overlap the source of the same or an earlier entry: a second run would
  move the file again. `parseMoveMap` rejects such a map.

## What it changes

1. **Moves** each file with `git mv`, so the index holds a pure rename.
2. **Rewrites module specifiers** in `.ts`, `.tsx`, `.js`, `.jsx` (and `m`/`c` variants) under
   `src/`, `e2e/` and `scripts/`, and at the repository root: `import`/`export … from`, `import()`, `typeof import()` and
   `import("…").T`, `require()`, `import x = require()`, and the first argument of `vi.mock`,
   `vi.doMock`, `vi.unmock`, `vi.doUnmock`, `vi.importActual` and `vi.importMock` (both
   `vi.mock("…")` and `vi.mock(import("…"))`).
   - `@/…` stays `@/…`.
   - A relative specifier stays relative while the target is in the importer's folder or below
     (`./x`). One that would climb out (`../`) becomes `@/…` inside `src/`, since the import
     boundary rules match specifiers; in `e2e/` and `scripts/` it stays relative.
   - The extension and `/index` are kept out when the original left them out.
   - Strings that do not name a module (comments, plain strings, `readFileSync` paths) are not
     touched.
3. **Rewrites the paths that root configs write by hand**, which are not module specifiers. Root
   scripts (`*.ts`, `*.mjs`, `*.cjs`, … at the repository root) also go through step 2, so the import
   at `next.config.ts:5` follows its module.
   - Every other string literal of a root script that names a moved path: `vitest.config.ts` coverage
     `exclude` and `include` patterns and alias paths, the plugin path at `next.config.ts:11`, the
     glob strings of `eslint.config.mjs`. Only a pattern's literal head (the segments before the
     first `*`, `?` or `{`) is mapped: `src/lib/combos/**` follows a move of `src/lib/combos`, and an
     exact path follows its file. A leading `./` is kept.
   - dependency-cruiser path patterns (a string that starts with `^`): `^<file>$` and `^<folder>/…`
     follow their path. `^src/lib/` does not change when one file leaves `src/lib`.
   - Each comma-separated item of `sonar-project.properties` and `.sonarcloud.properties`.
4. **Updates the path-keyed files.**
   - `.dependency-cruiser-known-violations.json`: each entry stays equal to the violation
     `pnpm arch` will report after the move. Paths follow the moves, and an edge whose specifier
     was rewritten gets the new `unresolvedTo` and, if it changed between relative and `@/`, the
     matching `dependencyTypes`: the gate's stale-entry check compares those fields too. The
     file keeps dependency-cruiser's own order and layout, so a later shrink-only prune only
     deletes entries.
   - `eslint-suppressions.json`, when it exists: moved files are renamed among the keys; the rest
     of the file stays byte for byte.
   - `eslint.config.mjs`: the generated migration-guard section lists the `"shim": true` entries
     (below).
5. **Checks** that every relative and `@/` specifier in the scanned files resolves after the
   moves. If one does not, it prints them, writes nothing and exits 1.

## What it reports without changing

Every run, dry or real, also prints three lists. They change nothing and never fail the run.

- **Coverage and test scope.** A moved file that a list of `vitest.config.ts` (`coverage.exclude`,
  `include`, …) or of the SonarCloud properties (`sonar.coverage.exclusions`, …) stops or starts
  selecting. A list selects a file when any of its patterns does. Moving a component out of
  `src/components/**` puts it in the Sonar coverage gate, for example: keep that, or add the new
  path to the list, but decide it in the pull request.
- **Old paths in docs.** Every Markdown file (`.md`, `.mdc`) that still names an old path, as
  `file:line "mention" -> "replacement"`, with the replacement in the form the mention used: the
  repository path, `@/…`, the path without `src/` (`lib/dice.ts`) or a relative link. Prose is never
  rewritten: fix it by hand. The history docs are left out: `docs/project/` (changelog, progress,
  fix history) and `docs/product/roadmap.md`.
- **Old paths left in configs.** The same, for the non-Markdown files at the root and under
  `.github/` after their rewrite: a comment, a regular expression with alternatives, a
  `package.json` script.

The docs and configs lists cover every entry of the map, not only this run's moves, so they keep
showing an old path until someone edits it.

The rewrites are left unstaged. Commit the renames first (`git commit`), then the rewrites
(`git commit -a`): a byte-identical move is always detected as a rename, so `git log --follow`
and concurrent edits on other branches carry across.

## A move pull request

1. Append the entries to `moves.json`; run `--dry-run` and read the plan.
2. Run it; commit the renames, then the rewrites.
3. Decide each coverage and test scope change, and fix the old paths the report lists in docs and
   configs by hand.
4. Run `npx tsc --noEmit`, `pnpm lint`, `pnpm arch` and the tests of the moved modules.

## On a branch that predates a move

Rebase it, then run `pnpm refactor:apply-moves`. Files the branch added or changed at an old path
move, and their specifiers, including relative ones written for the old folder, are rewritten.

A file left at the old path on purpose, such as a temporary re-export shim, is kept: the destination
already exists, so the plan reports "keeps N at the old path" and points every reference at the
new path.

## Temporary shims and the migration guard

A series may leave a re-export shim at an old path while a pending branch still imports it
(decision D8; [architecture.md, migration approach](../../docs/engineering/architecture.md#migration-approach)):

```ts
// src/lib/dice.ts: shim, deleted at the end of the playtest series
/** @deprecated Moved to `@/modules/playtest/domain/dice`. Run `pnpm refactor:apply-moves`. */
export * from "@/modules/playtest/domain/dice";
```

1. Mark the entry `"shim": true` in `moves.json` and run the codemod. It moves the file, points every
   reference at the new path, and writes the entry into the generated section of
   `eslint.config.mjs`, between `// <migration-guard>` and `// </migration-guard>`. Do not edit that
   section by hand; the codemod refuses a shim entry when the section is missing.
2. Write the shim at the old path. Later runs keep it ("keeps 1 at the old path").
3. From then on, `pnpm lint` fails on any import, `import()`, `typeof import()`, `require` or
   `vi.mock`-family call that names the shim, through `@/` or a relative path, with the rule
   `migration-guard/no-shim-import`
   ([migration-guard-rule.mjs](migration-guard-rule.mjs)). The reason: a `vi.mock` of the shim
   mocks the shim, not the moved module, so the test silently runs against the real one. The
   message names the module to use; rebasing and running the codemod fixes it. The shim's own
   files may name each other.
4. A file that must keep the old path for now (one a pending branch owns) is restored after the
   run, and its imports are recorded in the bulk suppressions:
   `pnpm exec eslint <file> --suppress-rule migration-guard/no-shim-import`.
5. The series' closing pull request deletes the shim and removes the mark; the next run empties the
   section.

## Limits

- Specifiers built at run time (a template with `${}`) are not seen. The migration guard does not
  read template literals at all.
- In configs, `[` and `]` are read as plain characters, not as a glob class, because Next.js route
  folders such as `[locale]` use them. A `.properties` value continued with `\` is not read.
- A config pattern whose head only contains a moved file (`src/components/**`) cannot follow it;
  the scope report lists it instead.
- The old-path report reads a path as one token: a brace list in prose
  (`src/lib/{http,security-headers}.ts`) or a path split by a line break is not seen.
- A move can fix a recorded violation (a file leaves `src/app`, say). `pnpm arch` then reports
  the entry as stale; prune it with the shrink-only command in `.dependency-cruiser.cjs`. It can
  also make dependency-cruiser pick another path for a recorded cycle, which shows the same way.
- For a file moved without the codemod, a relative specifier is resolved from its new folder
  first, then from its old one. If both folders hold a file of that name, the new one wins.

## Tests

```bash
npx vitest run scripts/refactor
```

`apply-moves.test.ts` and `config-pass.test.ts` run the codemod over throwaway git repositories
(`testing/fixture-repo.ts`); `migration-guard-rule.test.ts` runs the guard rule through ESLint and
checks that `eslint.config.mjs` turns it on; `move-map.test.ts` pins the map validation.

## Dead-export report

`dead-exports-report.ts` is not part of the codemod. It lists the exports under `src/` that no
production module imports, for the dead-code slices:

```bash
npx tsx scripts/refactor/dead-exports-report.ts          # one row per export, tab-separated
npx tsx scripts/refactor/dead-exports-report.ts --json
```

It is advisory and has no tests: check every row by hand before deleting anything. Its header
says what it skips and what it can miss. Knip replaces it once the advisory Knip report lands.

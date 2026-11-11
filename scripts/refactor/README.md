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
to the repository root. A move pull request **appends** its entries; entries are never edited or
removed, because branches still in flight re-run the map after a rebase.

- A folder entry moves every file git lists under it (tracked, or untracked and not ignored).
- A later entry may move an earlier destination further (a chain).
- A destination may not overlap the source of the same or an earlier entry: a second run would
  move the file again. `parseMoveMap` rejects such a map.

## What it changes

1. **Moves** each file with `git mv`, so the index holds a pure rename.
2. **Rewrites module specifiers** in `.ts`, `.tsx`, `.js`, `.jsx` (and `m`/`c` variants) under
   `src/`, `e2e/` and `scripts/`: `import`/`export … from`, `import()`, `typeof import()` and
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
3. **Updates the path-keyed files.**
   - `.dependency-cruiser-known-violations.json`: each entry stays equal to the violation
     `pnpm arch` will report after the move. Paths follow the moves, and an edge whose specifier
     was rewritten gets the new `unresolvedTo` and, if it changed between relative and `@/`, the
     matching `dependencyTypes`: the gate's stale-entry check compares those fields too.
   - `eslint-suppressions.json`, when it exists: moved files are renamed among the keys; the rest
     of the file stays byte for byte.
4. **Checks** that every relative and `@/` specifier in the scanned folders resolves after the
   moves. If one does not, it prints them, writes nothing and exits 1.

The rewrites are left unstaged. Commit the renames first (`git commit`), then the rewrites
(`git commit -a`): a byte-identical move is always detected as a rename, so `git log --follow`
and concurrent edits on other branches carry across.

## A move pull request

1. Append the entries to `moves.json`; run `--dry-run` and read the plan.
2. Run it; commit the renames, then the rewrites.
3. Run `npx tsc --noEmit`, `pnpm lint`, `pnpm arch` and the tests of the moved modules.
4. Search docs and configs for the old paths (`git grep -n "<old path>"`): root configs such as
   `vitest.config.ts`, `next.config.ts` and `sonar-project.properties` are not rewritten yet.

## On a branch that predates a move

Rebase it, then run `pnpm refactor:apply-moves`. Files the branch added or changed at an old path
move, and their specifiers, including relative ones written for the old folder, are rewritten.

A file left at the old path on purpose, such as a temporary re-export shim, is kept: the destination
already exists, so the plan reports "keeps N at the old path" and points every reference at the
new path.

## Limits

- Specifiers built at run time (a template with `${}`) are not seen.
- A move can fix a recorded violation (a file leaves `src/app`, say). `pnpm arch` then reports
  the entry as stale; prune it with the shrink-only command in `.dependency-cruiser.cjs`. It can
  also make dependency-cruiser pick another path for a recorded cycle, which shows the same way.
- For a file moved without the codemod, a relative specifier is resolved from its new folder
  first, then from its old one. If both folders hold a file of that name, the new one wins.

## Tests

```bash
npx vitest run scripts/refactor
```

`apply-moves.test.ts` runs the codemod over throwaway git repositories; `move-map.test.ts` pins
the map validation.

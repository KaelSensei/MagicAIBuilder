/**
 * Guards against stale `vi.mock` paths.
 *
 * - The unit tests pin the pure scanner in `vi-mock-paths.ts` on in-memory
 *   fixtures.
 * - The last test runs the scanner over every test file under `src/`. It
 *   fails and lists `file:line` when a mocked module path no longer resolves.
 *   That happens when a module moves and a string mock is left behind; the
 *   mock then silently applies to nothing.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { isBuiltin } from "node:module";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findMockCalls,
  findStaleMocks,
  formatStaleMock,
  type ModuleLookup,
  type TestSource,
} from "./vi-mock-paths";

/**
 * Fixture sources spell calls as `MOCK(` and `DO_MOCK(` and expand them here.
 * The repository scan at the bottom reads this file too, so a literal call in
 * a fixture, or in this function, would be reported as a real stale mock.
 */
const VI = "vi";
function fixture(text: string): string {
  return text
    .replaceAll("DO_MOCK(", `${VI}.doMock(`)
    .replaceAll("MOCK(", `${VI}.mock(`);
}

/** An in-memory repository: the listed files exist, the listed packages are installed. */
function lookupOf(
  files: readonly string[],
  packages: readonly string[] = []
): ModuleLookup {
  const fileSet = new Set(files);
  const packageSet = new Set(packages);
  return {
    isFile: (path) => fileSet.has(path),
    isInstalledPackage: (name) => packageSet.has(name),
  };
}

/** Runs the scanner on one test file and returns the formatted findings. */
function staleIn(
  path: string,
  source: string,
  lookup: ModuleLookup
): readonly string[] {
  return findStaleMocks([{ path, source }], lookup).map(formatStaleMock);
}

describe("findMockCalls", () => {
  it("finds vi.mock and vi.doMock calls with their 1-based line", () => {
    const source = fixture(
      [
        'import { x } from "./x";',
        'MOCK("@/lib/db/prisma", () => ({}));',
        "",
        "it('loads', async () => {",
        "  DO_MOCK('./helper');",
        "});",
      ].join("\n")
    );

    expect(findMockCalls(source)).toEqual([
      { method: "mock", specifier: "@/lib/db/prisma", line: 2 },
      { method: "doMock", specifier: "./helper", line: 5 },
    ]);
  });

  it("reads the typed vi.mock(import(…)) form and a specifier on the next line", () => {
    const source = fixture(
      [
        'MOCK(import("@/lib/logger"), () => ({}));',
        "MOCK(",
        '  "@/hooks/useToast",',
        "  () => ({}),",
        ");",
      ].join("\n")
    );

    expect(findMockCalls(source)).toEqual([
      { method: "mock", specifier: "@/lib/logger", line: 1 },
      { method: "mock", specifier: "@/hooks/useToast", line: 2 },
    ]);
  });

  it("skips commented-out calls and specifiers it cannot read statically", () => {
    const source = fixture(
      [
        '// MOCK("@/lib/old-path") is hoisted by Vitest',
        ' * MOCK("@/lib/in-a-doc-comment")',
        "MOCK(`@/lib/${name}`);",
        "MOCK(modulePath);",
        "MOCK();",
      ].join("\n")
    );

    expect(findMockCalls(source)).toEqual([]);
  });
});

describe("findStaleMocks", () => {
  it.each([
    ["a .ts file", "src/lib/deck/store.ts"],
    ["a .tsx file", "src/lib/deck/store.tsx"],
    ["a folder with index.ts", "src/lib/deck/store/index.ts"],
    ["a folder with index.tsx", "src/lib/deck/store/index.tsx"],
  ])("resolves @/ to src/ when the path names %s", (_kind, file) => {
    const source = fixture('MOCK("@/lib/deck/store");');

    expect(staleIn("src/app/page.test.tsx", source, lookupOf([file]))).toEqual(
      []
    );
  });

  it("resolves ./ and ../ against the test file's folder, and / against the repository root", () => {
    const source = fixture(
      [
        'MOCK("./CardTooltip");',
        'MOCK("../ui/Modal");',
        'MOCK("/src/components/ui/Modal");',
      ].join("\n")
    );
    const lookup = lookupOf([
      "src/components/card/CardTooltip.tsx",
      "src/components/ui/Modal.tsx",
    ]);

    expect(
      staleIn("src/components/card/CardRow.test.tsx", source, lookup)
    ).toEqual([]);
  });

  it("accepts a path that names an existing file with its extension", () => {
    const source = fixture('MOCK("@/messages/en/deck.json");');

    expect(
      staleIn(
        "src/i18n/request.test.ts",
        source,
        lookupOf(["src/messages/en/deck.json"])
      )
    ).toEqual([]);
  });

  it("reports a module path that no longer resolves, with its file and line", () => {
    const source = fixture(
      [
        'MOCK("@/lib/db/prisma");',
        "",
        'MOCK("@/lib/deck/moved-away", () => ({}));',
      ].join("\n")
    );

    expect(
      staleIn(
        "src/lib/deck/store.test.ts",
        source,
        lookupOf(["src/lib/db/prisma.ts"])
      )
    ).toEqual([
      'src/lib/deck/store.test.ts:3 vi.mock "@/lib/deck/moved-away": no module at ' +
        "src/lib/deck/moved-away, src/lib/deck/moved-away.ts, src/lib/deck/moved-away.tsx, " +
        "src/lib/deck/moved-away/index.ts, src/lib/deck/moved-away/index.tsx",
    ]);
  });

  it("ignores installed packages, subpaths included, and reports a package that is not installed", () => {
    const source = fixture(
      [
        'MOCK("next/navigation");',
        'MOCK("@dnd-kit/core");',
        'MOCK("node:fs");',
        'DO_MOCK("left-pad");',
      ].join("\n")
    );
    const lookup = lookupOf([], ["next", "@dnd-kit/core", "node:fs"]);

    expect(staleIn("src/hooks/useThing.test.ts", source, lookup)).toEqual([
      'src/hooks/useThing.test.ts:4 vi.doMock "left-pad": package "left-pad" is not installed',
    ]);
  });
});

/** The repository root, two levels above this file (`src/test/`). */
const REPO_ROOT = join(__dirname, "..", "..");

/** Reads every `*.test.ts` and `*.test.tsx` file under `src/`, with repository-relative POSIX paths. */
function readSourceTests(): readonly TestSource[] {
  const srcDir = join(REPO_ROOT, "src");
  return readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .filter((path) => /\.test\.tsx?$/.test(path))
    .map((path) => {
      const absolute = join(srcDir, path);
      return {
        path: relative(REPO_ROOT, absolute).split(sep).join("/"),
        source: readFileSync(absolute, "utf8"),
      };
    });
}

/** The real file system and `node_modules` of this checkout. */
const repositoryLookup: ModuleLookup = {
  isFile: (path) =>
    statSync(join(REPO_ROOT, path), { throwIfNoEntry: false })?.isFile() ??
    false,
  isInstalledPackage: (name) =>
    isBuiltin(name) ||
    existsSync(join(REPO_ROOT, "node_modules", name, "package.json")),
};

describe("the repository", () => {
  it("has no vi.mock or vi.doMock path under src/ that fails to resolve", () => {
    const tests = readSourceTests();
    const callCount = tests.reduce(
      (count, test) => count + findMockCalls(test.source).length,
      0
    );

    expect(tests.length).toBeGreaterThan(0);
    expect(callCount).toBeGreaterThan(0);
    expect(
      findStaleMocks(tests, repositoryLookup).map(formatStaleMock)
    ).toEqual([]);
  });
});

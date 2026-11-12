/**
 * Report of exported symbols under `src/` that no production module imports.
 *
 *   npx tsx scripts/refactor/dead-exports-report.ts [--json]
 *
 * It loads the TypeScript program of `tsconfig.json` with ts-morph and indexes
 * every import of every TypeScript file in the repository (`src/`, `e2e/`,
 * `scripts/` and the root configs): named, default and namespace imports, re-exports,
 * `import("…")` calls (which also covers `vi.mock(import("…"))`), string
 * `vi.mock("…")` paths and `import("…").Name` type queries. An export is
 * reported when no file other than its own module and test files uses it.
 * Each row says whether the module itself still uses the symbol (un-export it
 * then, rather than delete it) and which test files import it.
 *
 * It is a reading aid for the dead-code slices (master plan P1-27, P1-28), not
 * a gate. It lists test seams (a timeout exported for its test) as dead, and it
 * misses the exports of a module imported whole (a namespace import, or an
 * `import()` whose result is not destructured), so every row is checked by
 * hand, with a grep over the whole repository, docs included, before anything
 * is deleted. Knip (decision D7.5) replaces it once the advisory Knip report
 * lands.
 *
 * Skipped on purpose:
 * - Next.js special exports in `src/app/` (`default`, `generateMetadata`,
 *   `metadata`, route handlers…), `src/middleware.ts` and `src/instrumentation*`;
 * - `src/test/` (shared test helpers) and fixtures;
 * - the entry points of `src/modules/<context>/` (`index.ts`, `server.ts`,
 *   `client.ts`: decision D1 makes them public API);
 * - modules nothing imports at all, which dependency-cruiser's `no-orphans`
 *   rule already lists.
 *
 * @module refactor/dead-exports-report
 */
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { Node, Project, SyntaxKind, type SourceFile } from "ts-morph";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Names Next.js reads from route, page, layout and metadata files. */
const NEXT_SPECIAL_EXPORTS: ReadonlySet<string> = new Set([
  "default",
  "generateMetadata",
  "metadata",
  "generateStaticParams",
  "generateViewport",
  "viewport",
  "dynamic",
  "dynamicParams",
  "revalidate",
  "fetchCache",
  "runtime",
  "preferredRegion",
  "maxDuration",
  "alt",
  "size",
  "contentType",
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "config",
  "register",
  "onRequestError",
]);

const TEST_FILE = /\.(test|spec)\.tsx?$/;
const MODULE_ENTRY_POINT = /^src\/modules\/[^/]+\/(index|server|client)\.tsx?$/;
const RESOLVABLE_EXTENSIONS = [
  ".ts",
  ".tsx",
  "/index.ts",
  "/index.tsx",
] as const;

/** Every importer of one module, keyed by the imported name (`*` = all names). */
type ImportIndex = Map<string, Map<string, Set<string>>>;

/** One exported symbol that no production module imports. */
interface DeadExport {
  readonly file: string;
  readonly name: string;
  readonly kind: "value" | "type";
  readonly usedInsideItsModule: boolean;
  readonly testImporters: readonly string[];
}

function relativePath(file: SourceFile): string {
  return relative(ROOT, file.getFilePath());
}

function isTestFile(path: string): boolean {
  return TEST_FILE.test(path) || path.includes("/__tests__/");
}

/** Resolves an `@/…` or relative specifier to a repository path, as the bundler would. */
function resolveSpecifier(fromFile: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join("src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = join(dirname(fromFile), specifier);
  else return null;
  if (/\.(ts|tsx)$/.test(base) && existsSync(join(ROOT, base))) return base;
  for (const extension of RESOLVABLE_EXTENSIONS) {
    const candidate = base + extension;
    if (existsSync(join(ROOT, candidate))) return candidate;
  }
  return null;
}

function record(
  index: ImportIndex,
  target: string,
  name: string,
  importer: string
): void {
  const byName = index.get(target) ?? new Map<string, Set<string>>();
  const importers = byName.get(name) ?? new Set<string>();
  importers.add(importer);
  byName.set(name, importers);
  index.set(target, byName);
}

function stringArgument(node: Node): string | null {
  return Node.isStringLiteral(node) ||
    Node.isNoSubstitutionTemplateLiteral(node)
    ? node.getLiteralValue()
    : null;
}

/** Records the static imports and re-exports of one file. */
function indexDeclarations(
  index: ImportIndex,
  file: SourceFile,
  path: string
): void {
  for (const declaration of file.getImportDeclarations()) {
    const target = resolveSpecifier(
      path,
      declaration.getModuleSpecifierValue()
    );
    if (target === null) continue;
    if (declaration.getDefaultImport()) record(index, target, "default", path);
    if (declaration.getNamespaceImport()) record(index, target, "*", path);
    for (const named of declaration.getNamedImports()) {
      record(index, target, named.getName(), path);
    }
  }
  for (const declaration of file.getExportDeclarations()) {
    const specifier = declaration.getModuleSpecifierValue();
    if (specifier === undefined) continue;
    const target = resolveSpecifier(path, specifier);
    if (target === null) continue;
    const named = declaration.getNamedExports();
    if (named.length === 0) record(index, target, "*", path);
    for (const element of named) record(index, target, element.getName(), path);
  }
}

/**
 * The names taken from `const { a, b: c } = await import("…")` or from
 * `import("…").then(({ a }) => …)`, or null when the whole module object
 * escapes (any other shape counts as using every export).
 */
function destructuredNames(importCall: Node): readonly string[] | null {
  const pattern = awaitedPattern(importCall) ?? thenPattern(importCall);
  if (pattern === undefined || !Node.isObjectBindingPattern(pattern))
    return null;
  return pattern
    .getElements()
    .map(
      (element) => element.getPropertyNameNode()?.getText() ?? element.getName()
    );
}

function awaitedPattern(importCall: Node): Node | undefined {
  const awaited = importCall.getParent();
  const declaration = Node.isAwaitExpression(awaited)
    ? awaited.getParent()
    : undefined;
  return declaration !== undefined && Node.isVariableDeclaration(declaration)
    ? declaration.getNameNode()
    : undefined;
}

function thenPattern(importCall: Node): Node | undefined {
  const access = importCall.getParent();
  if (!Node.isPropertyAccessExpression(access) || access.getName() !== "then")
    return undefined;
  const call = access.getParent();
  const callback = Node.isCallExpression(call)
    ? call.getArguments()[0]
    : undefined;
  if (callback === undefined) return undefined;
  if (!Node.isArrowFunction(callback) && !Node.isFunctionExpression(callback))
    return undefined;
  return callback.getParameters()[0]?.getNameNode();
}

/** Records `import("…")`, `vi.mock("…")` and `import("…").Name` uses of one file. */
function indexExpressions(
  index: ImportIndex,
  file: SourceFile,
  path: string
): void {
  file.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const callee = node.getExpression();
      const firstArgument = node.getArguments()[0];
      if (firstArgument === undefined) return;
      const isDynamicImport = callee.getKind() === SyntaxKind.ImportKeyword;
      const isMock =
        callee.getText() === "vi.mock" || callee.getText() === "vi.doMock";
      if (!isDynamicImport && !isMock) return;
      const specifier = stringArgument(firstArgument);
      if (specifier === null) return;
      const target = resolveSpecifier(path, specifier);
      if (target === null) return;
      const names = isDynamicImport ? destructuredNames(node) : null;
      for (const name of names ?? ["*"]) record(index, target, name, path);
      return;
    }
    if (Node.isImportTypeNode(node)) {
      const argument = node.getArgument();
      const literal = Node.isLiteralTypeNode(argument)
        ? argument.getLiteral()
        : null;
      const specifier = literal === null ? null : stringArgument(literal);
      if (specifier === null) return;
      const target = resolveSpecifier(path, specifier);
      if (target === null) return;
      const qualifier = node.getQualifier();
      const name =
        qualifier === undefined ? "*" : qualifier.getText().split(".")[0];
      record(index, target, name ?? "*", path);
    }
  });
}

function isSkippedModule(path: string): boolean {
  if (!path.startsWith("src/") || isTestFile(path) || path.endsWith(".d.ts"))
    return true;
  if (path.startsWith("src/test/") || path.includes("/fixtures/")) return true;
  if (MODULE_ENTRY_POINT.test(path)) return true;
  return path.startsWith("src/generated/");
}

function isNextSpecial(path: string, name: string): boolean {
  const nextOwned =
    path.startsWith("src/app/") ||
    path === "src/middleware.ts" ||
    path.startsWith("src/instrumentation");
  return nextOwned && NEXT_SPECIAL_EXPORTS.has(name);
}

function usedInside(file: SourceFile, name: string): boolean {
  const declarations = file.getExportedDeclarations().get(name) ?? [];
  return declarations.some((declaration) => {
    const nameNode = Node.hasName(declaration)
      ? declaration.getNameNode()
      : undefined;
    if (nameNode === undefined || !Node.isIdentifier(nameNode)) return false;
    return nameNode
      .findReferencesAsNodes()
      .some(
        (reference) =>
          reference.getSourceFile() === file && reference !== nameNode
      );
  });
}

function findDeadExports(project: Project, index: ImportIndex): DeadExport[] {
  const dead: DeadExport[] = [];
  for (const file of project.getSourceFiles()) {
    const path = relativePath(file);
    if (isSkippedModule(path)) continue;
    const byName = index.get(path);
    if (byName === undefined) continue; // an orphan: dependency-cruiser reports it
    const everything = [...(byName.get("*") ?? [])];
    for (const [name, declarations] of file.getExportedDeclarations()) {
      if (isNextSpecial(path, name)) continue;
      if (
        declarations.every(
          (declaration) => declaration.getSourceFile() !== file
        )
      )
        continue;
      const importers = [...(byName.get(name) ?? []), ...everything].filter(
        (importer) => importer !== path
      );
      const production = importers.filter((importer) => !isTestFile(importer));
      if (production.length > 0) continue;
      const isType = declarations.every(
        (declaration) =>
          Node.isInterfaceDeclaration(declaration) ||
          Node.isTypeAliasDeclaration(declaration)
      );
      dead.push({
        file: path,
        name,
        kind: isType ? "type" : "value",
        usedInsideItsModule: usedInside(file, name),
        testImporters: [...new Set(importers)].sort(),
      });
    }
  }
  return dead.sort(
    (a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name)
  );
}

function main(): void {
  const project = new Project({
    tsConfigFilePath: join(ROOT, "tsconfig.json"),
  });
  const index: ImportIndex = new Map();
  for (const file of project.getSourceFiles()) {
    const path = relativePath(file);
    if (path.startsWith("node_modules/") || path.startsWith("..")) continue;
    indexDeclarations(index, file, path);
    indexExpressions(index, file, path);
  }
  const dead = findDeadExports(project, index);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(dead, null, 2));
    return;
  }
  for (const row of dead) {
    const use = row.usedInsideItsModule ? "used-inside" : "unused-inside";
    const tests =
      row.testImporters.length === 0 ? "-" : row.testImporters.join(",");
    console.log([row.file, row.name, row.kind, use, tests].join("\t"));
  }
  console.error(`${dead.length} exports with no production importer`);
}

main();

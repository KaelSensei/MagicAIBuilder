// dependency-cruiser configuration for the full import graph, type-only imports
// included: the first half of `pnpm arch` and the source of `pnpm arch:graph`
// (ADR 0007, stage 3). `.dependency-cruiser.runtime.cjs` is the second half: it
// checks the graph that ships, where type-only imports are erased.
//
// What this half checks, on `src/` without its tests:
// - cycles, runtime or type-only;
// - today's layer rules, the same ones ESLint `no-restricted-imports` checks
//   import by import in `eslint.config.mjs` (phase 1, P0-14), so the graph and
//   the linter agree;
// - the floor rules of the `src/modules/<context>/` layout (ADR 0001 and
//   ADR 0002), at `error` for every context since before the first one
//   (`combos`) moved in: a pure domain, browser layers that never reach the
//   server, use cases that are not adapters, other contexts reached only
//   through entry points;
// - the boundary rules each context must meet when its move series closes
//   (`CLOSED_CONTEXTS` below): an allow-list for `domain/` and `application/`,
//   no browser import from `infrastructure/`, `testing/` kept to tests, and the
//   code still outside `src/modules/` reaching the context only through its
//   entry points. They run at `error` for a closed context and at `warn` for
//   the others, so a series in flight sees what it still has to fix;
// - orphans, as information only.
//
// Known violations live in `.dependency-cruiser-known-violations.json`, which
// `pnpm arch` reads with `--ignore-known`. The baseline may only shrink, and a
// fixed violation left in it fails the run (`staleEntriesSeverity` below).
// After fixing one, prune it with
//   pnpm exec depcruise src --config .dependency-cruiser.cjs --baseline --baseline-mode shrink-only
// A pull request that adds an entry says why in its description
// (docs/engineering/quality-gate.md, "Architecture gate").
//
// Rules reference: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md

/** Test files are not part of the shipped graph; ESLint covers their imports. */
const TEST_FILE = "\\.(test|spec)\\.tsx?$";

/**
 * Matches an npm package by its resolved path. pnpm resolves a package to
 * `node_modules/.pnpm/<name>@<version>/node_modules/<name>/…`, so the pattern
 * anchors on the last `node_modules/<name>/` segment.
 */
function npmPackage(namesPattern) {
  return `(^|/)node_modules/(${namesPattern})/`;
}

/**
 * The layers of a context folder (ADR 0001) and its entry points (ADR 0002).
 * A context is `src/modules/<context>/`.
 */
const MODULES = {
  domainSide: "^src/modules/[^/]+/(domain/|index\\.ts$)",
  browserSide: "^src/modules/[^/]+/(client/|ui/|client\\.ts$)",
  serverSide: "^src/modules/[^/]+/(application/|infrastructure/|server\\.ts$)",
  outerLayers: "^src/modules/[^/]+/(application|infrastructure|client|ui)/",
  entryPoints: "^src/modules/[^/]+/(index|server|client)\\.ts$",
  components: "^src/modules/[^/]+/ui/",
};

/** Prisma, as the generated client package and as the shared instance. */
const PRISMA = [
  "^src/lib/db/prisma\\.ts$",
  npmPackage("@prisma/client|\\.prisma"),
];

/**
 * The contexts whose move series has closed (ADR 0007, stage 3). Their
 * boundary rules (`contextBoundaryRules` below) run at `error`; every other
 * folder under `src/modules/` carries the same rules at `warn` while its
 * series runs, so a branch that predates a move sees what to fix without
 * being blocked. A series' closing pull request adds its context here and
 * deletes the context's entries from the known-violations baseline; nothing
 * else in this file changes. `combos` closed with CMB-08 (2026-11),
 * `rules-reference` with RR-06 (2026-11), `meta-insights` with MI-07 (2026-11).
 */
const CLOSED_CONTEXTS = ["combos", "rules-reference", "meta-insights"];

/**
 * The shared kernel a `domain/` folder may import: pure helpers with no IO,
 * no framework and no business meaning (ADR 0001 rule 4 keeps the kernel in
 * `src/lib`; ADR 0003 wants the domain testable with plain values). Anything
 * else a domain needs comes from its own `domain/` or another context's
 * `index.ts`. Widen this list only for a module that meets the same test.
 */
const PURE_SHARED_KERNEL = ["^src/lib/guards\\.ts$", "^src/lib/text/"];

/** The server-side shared kernel a use case may import (architecture.md, "Layers"). */
const SERVER_SHARED_KERNEL = ["^src/lib/logger\\.ts$"];

/**
 * A `from` or `to` matcher, with `pathNot` left out when it would be empty:
 * dependency-cruiser's schema wants a pattern there, not an empty list.
 */
function where(path, pathNot) {
  return pathNot.length > 0 ? { path, pathNot } : { path };
}

/**
 * The boundary rules one group of contexts must meet (ADR 0001 layers,
 * ADR 0002 entry points). `context` is a regex group that matches the folder
 * name and captures it as `$1`, so a rule's `to` can name the importer's own
 * context. `others` lists the context roots this group leaves to the other
 * group: the open group excludes the closed contexts, which it would
 * otherwise report twice.
 *
 * The floor rules above (`domain-is-pure`, `browser-layers-not-server`,
 * `application-is-not-an-adapter`, `public-api-only`) stay at `error` for
 * every context; these add what a finished context must also satisfy.
 *
 * @param {{ suffix: string, severity: "warn" | "error", context: string, others: string[] }} group
 * @returns {import('dependency-cruiser').IForbiddenRuleType[]} the rules
 */
function contextBoundaryRules({ suffix, severity, context, others }) {
  const root = `^src/modules/${context}/`;
  const preface =
    severity === "warn"
      ? "This context's move series is still open, so this is a warning; it becomes an error when the " +
        "closing pull request lists the context in CLOSED_CONTEXTS (.dependency-cruiser.cjs). "
      : "";
  return [
    {
      name: `domain-imports-domain${suffix}`,
      comment:
        preface +
        "`domain/` imports only its own `domain/`, another context's `index.ts` or a pure shared helper " +
        "(`src/lib/guards.ts`, `src/lib/text/`): readonly data and pure functions, usable on the server, in the " +
        "browser and in tests with plain values (ADR 0001, ADR 0003). Move the shared rule into a domain or an " +
        "`index.ts`, or declare a port and let an outer layer implement it.",
      severity,
      from: where(`${root}domain/`, others),
      to: {
        path: "^src/",
        pathNot: [
          "^src/modules/$1/domain/",
          "^src/modules/[^/]+/index\\.ts$",
          ...PURE_SHARED_KERNEL,
        ],
      },
    },
    {
      name: `application-imports-domain-and-ports${suffix}`,
      comment:
        preface +
        "`application/` imports only its own `domain/` and ports, another context's `index.ts` or `server.ts`, " +
        "and the logger (ADR 0001; architecture.md, Layers). A use case takes everything else through a port " +
        "declared next to it and implemented in `infrastructure/`.",
      severity,
      from: where(`${root}application/`, others),
      to: {
        path: "^src/",
        pathNot: [
          "^src/modules/$1/(domain|application)/",
          "^src/modules/[^/]+/(index|server)\\.ts$",
          ...SERVER_SHARED_KERNEL,
        ],
      },
    },
    {
      name: `infrastructure-not-browser${suffix}`,
      comment:
        preface +
        "`infrastructure/` implements ports for the server: it never imports `client/`, `ui/` or `client.ts` " +
        "(ADR 0001). A type both sides need belongs in `domain/`, published by `index.ts`.",
      severity,
      from: where(`${root}infrastructure/`, others),
      to: { path: "^src/modules/[^/]+/(client/|ui/|client\\.ts$)" },
    },
    {
      name: `testing-only-from-tests${suffix}`,
      comment:
        preface +
        "`testing/` holds fakes, contract suites and MSW handlers for tests (ADR 0005); production code never " +
        "imports it. Tests are not cruised, so any importer reported here ships. Move the shared piece into " +
        "`domain/` if production needs it.",
      severity,
      from: {
        path: "^src/",
        pathNot: ["^src/modules/[^/]+/testing/", "^src/test/"],
      },
      to: where(`${root}testing/`, others),
    },
    {
      name: `through-entry-points${suffix}`,
      comment:
        preface +
        "Code outside `src/modules/` reaches a context only through its `index.ts`, `server.ts` or `client.ts`, " +
        "or a component path under `ui/` (ADR 0002). Import the symbol from the entry point that exports it, or " +
        "export it there if it belongs to the context's public API. Inside `src/modules/`, `public-api-only` " +
        "says the same thing.",
      severity,
      from: { path: "^src/", pathNot: "^src/modules/" },
      to: where(root, [
        `${root}(index|server|client)\\.ts$`,
        `${root}ui/`,
        ...others,
      ]),
    },
    {
      name: `browser-folders-not-server-entry${suffix}`,
      comment:
        preface +
        "Components and hooks run in the browser: they reach a context through `index.ts`, `client.ts` or a " +
        "`ui/` path, never through `server.ts` (ADR 0002 rules 2 and 3). Call the context's API route through " +
        "its typed client. `.dependency-cruiser.runtime.cjs` also catches this transitively, through the " +
        "`server-only` marker.",
      severity,
      from: { path: "^src/(components|hooks)/" },
      to: where(`${root}server\\.ts$`, others),
    },
  ];
}

/** The closed contexts at `error`, every other context at `warn`. */
const CONTEXT_RULES = [
  {
    suffix: "",
    severity: "error",
    context: `(${CLOSED_CONTEXTS.join("|")})`,
    others: [],
  },
  {
    suffix: "-series-open",
    severity: "warn",
    context: "([^/]+)",
    others: [`^src/modules/(${CLOSED_CONTEXTS.join("|")})/`],
  },
].flatMap(contextBoundaryRules);

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment:
        "This import closes a cycle. A cycle makes its modules impossible to understand, test or move one at a " +
        "time. Break it: move the shared type or function into a module both sides can import, or invert the " +
        "dependency (ADR 0007). Type-only cycles count too; the three that existed in 2026-11 are in the baseline.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "lib-not-outer-layers",
      comment:
        "`src/lib` sits below components, hooks and routes. Move the shared type or function down into " +
        "`src/lib`, or let the caller pass it in (eslint.config.mjs, libIntoOuterLayers).",
      severity: "error",
      from: { path: "^src/lib/" },
      to: { path: "^src/(components|hooks|app)/" },
    },
    {
      name: "ui-not-routes",
      comment:
        "Components and hooks must not import from `src/app` (routes and route handlers). Move the shared type " +
        "down into `src/lib` (eslint.config.mjs, uiIntoRoutes).",
      severity: "error",
      from: { path: "^src/(components|hooks)/" },
      to: { path: "^src/app/" },
    },
    {
      name: "ui-not-database",
      comment:
        "Components and hooks run in the browser: they reach data through an API route and its typed client, " +
        "never through Prisma (eslint.config.mjs, uiIntoDatabase).",
      severity: "error",
      from: { path: "^src/(components|hooks)/" },
      to: { path: PRISMA },
    },
    {
      name: "domain-is-pure",
      comment:
        "`domain/` and `index.ts` hold readonly data and pure functions (ADR 0003): no framework, store, " +
        "database or outer layer. Declare a port in `domain/` and let an outer layer implement it.",
      severity: "error",
      from: { path: MODULES.domainSide },
      to: {
        path: [
          MODULES.outerLayers,
          "^src/modules/[^/]+/(server|client)\\.ts$",
          "^src/lib/db/",
          npmPackage(
            "react|react-dom|next|next-intl|next-auth|zustand|@tanstack/[^/]+|@prisma/client|\\.prisma|server-only"
          ),
        ],
      },
    },
    {
      name: "browser-layers-not-server",
      comment:
        "`client/`, `ui/` and `client.ts` ship to the browser (ADR 0002): no Prisma, no server-only module, no " +
        "`server.ts`, `application/` or `infrastructure/`. Go through the context's API client.",
      severity: "error",
      from: { path: MODULES.browserSide },
      to: { path: [MODULES.serverSide, ...PRISMA, npmPackage("server-only")] },
    },
    {
      name: "public-api-only",
      comment:
        "Another context is reached only through its `index.ts`, `server.ts` or `client.ts`, or a component " +
        "path under `ui/` (ADR 0002). Export what you need from the right entry point instead of importing an " +
        "internal file.",
      severity: "error",
      // `$1` is the context captured by `from`: a context may import its own files.
      from: { path: "^src/modules/([^/]+)/" },
      to: {
        path: "^src/modules/[^/]+/",
        pathNot: ["^src/modules/$1/", MODULES.entryPoints, MODULES.components],
      },
    },
    {
      name: "application-is-not-an-adapter",
      comment:
        "`application/` holds use cases: they take a parsed command and call ports, so they run in Vitest " +
        "without Next.js, a database or the network (ADR 0001, ADR 0003). No `infrastructure/`, `client/` or " +
        "`ui/`, no Prisma or other `src/lib/db/` module, no Next.js and no Zod (input is parsed at the route). " +
        "Declare a port in `application/`, implement it in `infrastructure/` and wire both in `server.ts`. " +
        "ESLint also bans the global `fetch` there (docs/architecture/target-structure.md, Enforcement).",
      severity: "error",
      from: { path: "^src/modules/[^/]+/application/" },
      to: {
        path: [
          "^src/modules/[^/]+/(infrastructure|client|ui)/",
          "^src/lib/db/",
          npmPackage("@prisma/client|\\.prisma|next|zod"),
        ],
      },
    },
    ...CONTEXT_RULES,
    {
      name: "no-orphans",
      comment:
        "This module imports nothing and nothing imports it, so it is probably dead. Advisory only: deleting a " +
        "feature is an owner decision (decision D8 of the clean-code programme).",
      severity: "info",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          // Test support and fixtures are imported by tests, which are not cruised.
          "^src/test/",
          "/fixtures/",
          // Loaded by next.config.ts, outside src/.
          "^src/lib/security-headers\\.ts$",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: ["node_modules"] },
    exclude: { path: [TEST_FILE] },
    // Keep type-only imports in the graph: the cycle rule must see them, and
    // the layer rules mirror ESLint, which bans `import type` as well.
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs"],
      mainFields: ["main", "types", "typings"],
    },
    skipAnalysisNotInRules: true,
    // A violation fixed but still listed in the baseline fails the run, so the
    // baseline shrinks in the same pull request as the fix.
    baseline: { staleEntriesSeverity: "error" },
    // Readable node names keep the generated graph's diffs reviewable.
    reporterOptions: { mermaid: { minify: false } },
  },
};

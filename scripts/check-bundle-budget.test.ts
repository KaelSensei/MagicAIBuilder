// @vitest-environment node
/**
 * I-71 slice 7 (spec 2.2): after `next build`, the compressed JavaScript each
 * key route loads first is compared with `perf-budgets.json`, and CI fails when
 * a route goes over. Solitary tests on fixture manifests: no build, no network.
 */
import { describe, expect, it } from "vitest";
import {
  checkBundleBudget,
  parseBudgets,
  renderReport,
} from "./check-bundle-budget.mjs";

const BUILDER = "/[locale]/builder/[deckId]/page";
const HOME = "/[locale]/page";

/** Compressed sizes of the fixture build's files, in bytes. */
const SIZES: Readonly<Record<string, number>> = {
  "static/chunks/webpack.js": 1_000,
  "static/chunks/main-app.js": 2_000,
  "static/chunks/app/[locale]/layout.js": 300,
  "static/chunks/app/[locale]/builder/[deckId]/page.js": 4_000,
  "static/chunks/app/[locale]/page.js": 500,
  "static/css/app.css": 9_999,
};

function sizeOf(file: string): number {
  const size = SIZES[file];
  if (size === undefined) throw new Error(`no fixture size for ${file}`);
  return size;
}

/** An `app-build-manifest.json` `pages` map, as `next build` writes it. */
const PAGES: Readonly<Record<string, readonly string[]>> = {
  [BUILDER]: [
    "static/chunks/webpack.js",
    "static/chunks/main-app.js",
    "static/chunks/app/[locale]/layout.js",
    "static/chunks/app/[locale]/builder/[deckId]/page.js",
  ],
  [HOME]: [
    "static/chunks/webpack.js",
    "static/chunks/main-app.js",
    "static/chunks/app/[locale]/layout.js",
    "static/chunks/app/[locale]/page.js",
  ],
};

const BUILDER_FIRST_LOAD = 1_000 + 2_000 + 300 + 4_000;

describe("checkBundleBudget — a key route against its budget", () => {
  it("passes a route whose first-load JavaScript equals its budget", () => {
    const report = checkBundleBudget({
      pages: PAGES,
      budgets: { [BUILDER]: BUILDER_FIRST_LOAD },
      sizeOf,
    });

    expect(report).toEqual({
      ok: true,
      routes: [
        {
          route: BUILDER,
          verdict: "within",
          bytes: BUILDER_FIRST_LOAD,
          budget: BUILDER_FIRST_LOAD,
        },
      ],
    });
  });

  it("fails a route one byte over its budget", () => {
    const report = checkBundleBudget({
      pages: PAGES,
      budgets: { [BUILDER]: BUILDER_FIRST_LOAD - 1 },
      sizeOf,
    });

    expect(report).toEqual({
      ok: false,
      routes: [
        {
          route: BUILDER,
          verdict: "over",
          bytes: BUILDER_FIRST_LOAD,
          budget: BUILDER_FIRST_LOAD - 1,
        },
      ],
    });
  });

  it("fails the whole check when one route of several is over", () => {
    const report = checkBundleBudget({
      pages: PAGES,
      budgets: { [HOME]: 1_000_000, [BUILDER]: 1 },
      sizeOf,
    });

    expect(report.ok).toBe(false);
    expect(report.routes.map((line) => line.verdict)).toEqual([
      "within",
      "over",
    ]);
  });
});

describe("checkBundleBudget — what counts as first-load JavaScript", () => {
  it("counts a chunk the manifest lists twice once, and ignores stylesheets", () => {
    const report = checkBundleBudget({
      pages: {
        [HOME]: [
          "static/chunks/webpack.js",
          "static/chunks/webpack.js",
          "static/chunks/app/[locale]/page.js",
          "static/css/app.css",
        ],
      },
      budgets: { [HOME]: 1_500 },
      sizeOf,
    });

    expect(report.routes).toEqual([
      { route: HOME, verdict: "within", bytes: 1_500, budget: 1_500 },
    ]);
  });
});

describe("checkBundleBudget — a budgeted route the build no longer has", () => {
  it("fails, so a renamed route cannot leave its budget silently", () => {
    const report = checkBundleBudget({
      pages: PAGES,
      budgets: { "/[locale]/decks/page": 50_000 },
      sizeOf,
    });

    expect(report).toEqual({
      ok: false,
      routes: [
        { route: "/[locale]/decks/page", verdict: "missing", budget: 50_000 },
      ],
    });
  });
});

describe("parseBudgets — the committed budget file", () => {
  it("reads each route's budget in bytes", () => {
    expect(
      parseBudgets({ routes: { [HOME]: 120_000, [BUILDER]: 300_000 } })
    ).toEqual({ [HOME]: 120_000, [BUILDER]: 300_000 });
  });

  it.each([
    ["a missing routes map", {}],
    ["an empty routes map", { routes: {} }],
    ["a budget that is not a number", { routes: { [HOME]: "120 KB" } }],
    ["a fractional budget", { routes: { [HOME]: 1.5 } }],
    ["a budget of zero", { routes: { [HOME]: 0 } }],
  ])("rejects %s", (_label, file) => {
    expect(() => parseBudgets(file)).toThrow(/perf-budgets\.json/);
  });
});

describe("renderReport — the CI log", () => {
  it("names each route with its size and budget in kB, as next build prints them", () => {
    const text = renderReport({
      ok: false,
      routes: [
        { route: HOME, verdict: "within", bytes: 241_618, budget: 251_618 },
        { route: BUILDER, verdict: "over", bytes: 200_001, budget: 200_000 },
        { route: "/[locale]/decks/page", verdict: "missing", budget: 50_000 },
      ],
    });

    expect(text.split("\n")).toEqual([
      `ok       ${HOME}: 241.6 kB of 251.6 kB`,
      `OVER     ${BUILDER}: 200.0 kB of 200.0 kB (1 byte over)`,
      "MISSING  /[locale]/decks/page: not in the build (budget 50.0 kB)",
      "Bundle budget exceeded. Shrink the route, or raise its budget in perf-budgets.json with the reason in the pull request.",
    ]);
  });

  it("ends with a pass line when every route is within budget", () => {
    const text = renderReport({
      ok: true,
      routes: [{ route: HOME, verdict: "within", bytes: 1_000, budget: 2_000 }],
    });

    expect(text.split("\n")).toEqual([
      `ok       ${HOME}: 1.0 kB of 2.0 kB`,
      "Every key route is within its bundle budget.",
    ]);
  });
});

// I-71 slice 7 (docs/product/specs/i71-speed-uptime-and-recovery.md, 2.1 and
// 2.2): after `next build`, sums the compressed JavaScript each key route loads
// first and compares it with perf-budgets.json. A route over its budget, or a
// budgeted route the build no longer has, fails the CI job. The measure does
// not depend on timing, so it cannot flake and needs no retry.
//
// "First-load JavaScript" is what `next build` prints in its First Load JS
// column for an App Router page: the `.js` files its entry in
// `.next/app-build-manifest.json` lists, each counted once, gzip-compressed at
// level 9 as Next's `gzip-size` does.
//
// Raising a budget means editing perf-budgets.json, so the change and its
// reason appear in review.
//
// Usage: pnpm build && node scripts/check-bundle-budget.mjs [.next] [perf-budgets.json]
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/**
 * @typedef {Readonly<Record<string, readonly string[]>>} ManifestPages
 *   The `pages` map of `.next/app-build-manifest.json`: page entry -> built files.
 * @typedef {Readonly<Record<string, number>>} Budgets
 *   Page entry -> largest allowed first-load JavaScript, in compressed bytes.
 */

/**
 * @typedef {{ readonly route: string, readonly verdict: "within" | "over", readonly bytes: number, readonly budget: number }} MeasuredRoute
 * @typedef {{ readonly route: string, readonly verdict: "missing", readonly budget: number }} MissingRoute
 * @typedef {MeasuredRoute | MissingRoute} RouteResult
 * @typedef {{ readonly ok: boolean, readonly routes: readonly RouteResult[] }} BudgetReport
 */

const BUDGET_FILE = "perf-budgets.json";
/** Bytes per kB, the unit of `next build`'s size table, so both read the same. */
const KB = 1000;

/**
 * Compares each budgeted route's first-load JavaScript with its budget.
 *
 * @param {object} input
 * @param {ManifestPages} input.pages The build's page entries and their files.
 * @param {Budgets} input.budgets The committed budgets, in budget-file order.
 * @param {(file: string) => number} input.sizeOf Compressed size of a built file, relative to `.next`.
 * @returns {BudgetReport} One result per budgeted route; `ok` only when every route is within.
 */
export function checkBundleBudget({ pages, budgets, sizeOf }) {
  const routes = Object.entries(budgets).map(([route, budget]) =>
    checkRoute(route, budget, pages[route], sizeOf)
  );
  return {
    ok: routes.every((result) => result.verdict === "within"),
    routes,
  };
}

/**
 * @param {string} route
 * @param {number} budget
 * @param {readonly string[] | undefined} files
 * @param {(file: string) => number} sizeOf
 * @returns {RouteResult}
 */
function checkRoute(route, budget, files, sizeOf) {
  if (files === undefined) return { route, verdict: "missing", budget };
  const bytes = firstLoadBytes(files, sizeOf);
  return { route, verdict: bytes > budget ? "over" : "within", bytes, budget };
}

/**
 * Sums the compressed size of a page's JavaScript files, each counted once.
 *
 * @param {readonly string[]} files
 * @param {(file: string) => number} sizeOf
 * @returns {number}
 */
function firstLoadBytes(files, sizeOf) {
  let total = 0;
  for (const file of new Set(files)) {
    if (file.endsWith(".js")) total += sizeOf(file);
  }
  return total;
}

/**
 * Validates the parsed content of perf-budgets.json.
 *
 * @param {unknown} file The parsed JSON.
 * @returns {Budgets} Page entry -> budget in bytes.
 * @throws {Error} When `routes` is missing or empty, or a budget is not a positive whole number of bytes.
 */
export function parseBudgets(file) {
  const routes = isRecord(file) ? file.routes : undefined;
  if (!isRecord(routes) || Object.keys(routes).length === 0) {
    throw new Error(
      `${BUDGET_FILE}: "routes" must map each key route to a budget in bytes.`
    );
  }
  /** @type {Record<string, number>} */
  const budgets = {};
  for (const [route, budget] of Object.entries(routes)) {
    if (
      typeof budget !== "number" ||
      !Number.isInteger(budget) ||
      budget <= 0
    ) {
      throw new Error(
        `${BUDGET_FILE}: the budget of ${route} must be a positive whole number of bytes.`
      );
    }
    budgets[route] = budget;
  }
  return budgets;
}

/**
 * @param {unknown} value
 * @returns {value is Readonly<Record<string, unknown>>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Renders the report as the lines the CI log shows.
 *
 * @param {BudgetReport} report
 * @returns {string} One line per route, then a closing verdict line.
 */
export function renderReport(report) {
  const verdict = report.ok
    ? "Every key route is within its bundle budget."
    : "Bundle budget exceeded. Shrink the route, or raise its budget in perf-budgets.json with the reason in the pull request.";
  return [...report.routes.map(renderRoute), verdict].join("\n");
}

/**
 * @param {RouteResult} result
 * @returns {string}
 */
function renderRoute(result) {
  switch (result.verdict) {
    case "within":
      return `ok       ${result.route}: ${kb(result.bytes)} of ${kb(result.budget)}`;
    case "over": {
      const excess = result.bytes - result.budget;
      return `OVER     ${result.route}: ${kb(result.bytes)} of ${kb(result.budget)} (${excess} ${excess === 1 ? "byte" : "bytes"} over)`;
    }
    case "missing":
      return `MISSING  ${result.route}: not in the build (budget ${kb(result.budget)})`;
    default:
      return assertNever(result);
  }
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function kb(bytes) {
  return `${(bytes / KB).toFixed(1)} kB`;
}

/**
 * @param {never} value
 * @returns {never}
 */
function assertNever(value) {
  throw new Error(`Unexpected route result: ${JSON.stringify(value)}`);
}

/**
 * Checks a finished build against the committed budgets and exits non-zero
 * when a route is over or missing.
 *
 * @param {string} distDir The build output, `.next` by default.
 * @param {string} budgetPath The budget file, perf-budgets.json by default.
 */
function main(distDir, budgetPath) {
  const manifest = JSON.parse(
    readFileSync(join(distDir, "app-build-manifest.json"), "utf8")
  );
  const report = checkBundleBudget({
    pages: manifest.pages,
    budgets: parseBudgets(JSON.parse(readFileSync(budgetPath, "utf8"))),
    sizeOf: (file) =>
      gzipSync(readFileSync(join(distDir, file)), { level: 9 }).length,
  });
  process.stdout.write(`${renderReport(report)}\n`);
  if (!report.ok) process.exitCode = 1;
}

const isMain =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv[2] ?? ".next", process.argv[3] ?? BUDGET_FILE);
}

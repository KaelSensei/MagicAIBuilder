/**
 * Pins the shape of the context boundary rules in `.dependency-cruiser.cjs`
 * (ADR 0007, stage 3): a context whose move series has closed runs every
 * boundary rule at `error`, and every other context gets the same rules at
 * `warn`. The rules' effect on real imports is checked by `pnpm arch`
 * itself (its Red evidence is a deliberate violation, recorded in the
 * closing pull request of each series); this test guards against a later
 * edit that silently downgrades a closed context or forgets one of its rules.
 *
 * A series' closing pull request adds its context to `CLOSED_CONTEXTS` below
 * at the same time as to the config, so the two lists cannot drift apart.
 */
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

type PathMatcher = {
  readonly path?: string | readonly string[];
  readonly pathNot?: string | readonly string[];
};

type ForbiddenRule = {
  readonly name: string;
  readonly severity: string;
  readonly from: PathMatcher;
  readonly to: PathMatcher;
};

const config: {
  readonly forbidden: readonly ForbiddenRule[];
} = require("../../.dependency-cruiser.cjs");

/**
 * The contexts whose series have closed: `combos` with CMB-08 (#1470),
 * `rules-reference` with RR-06.
 */
const CLOSED_CONTEXTS = ["combos", "rules-reference"] as const;

/** The boundary rules every closed context runs at `error`. */
const BOUNDARY_RULES = [
  "domain-imports-domain",
  "application-imports-domain-and-ports",
  "infrastructure-not-browser",
  "testing-only-from-tests",
  "through-entry-points",
  "browser-folders-not-server-entry",
] as const;

/** The suffix of the twin rule a context carries while its series is open. */
const OPEN_SUFFIX = "-series-open";

/** One rule per closed context and boundary rule, for `it.each`. */
const CLOSED_CASES = CLOSED_CONTEXTS.flatMap((context) =>
  BOUNDARY_RULES.map((rule) => ({ context, rule }))
);

function patterns(matcher: PathMatcher): readonly string[] {
  return [matcher.path ?? [], matcher.pathNot ?? []].flatMap((value) =>
    typeof value === "string" ? [value] : [...value]
  );
}

/**
 * Whether a pattern names `context` inside one of its alternation groups, as
 * `(combos|rules-reference)` does for both contexts. A plain substring check
 * would miss a context once a second one joins the group.
 */
function groupNames(pattern: string, context: string): boolean {
  return [...pattern.matchAll(/\(([^()]+)\)/g)].some((match) =>
    match[1].split("|").includes(context)
  );
}

function mentions(rule: ForbiddenRule, context: string): boolean {
  return [...patterns(rule.from), ...patterns(rule.to)].some((pattern) =>
    groupNames(pattern, context)
  );
}

function ruleNamed(name: string): ForbiddenRule {
  const rule = config.forbidden.find((candidate) => candidate.name === name);
  if (rule === undefined) throw new Error(`No rule named ${name}`);
  return rule;
}

describe("the context boundary rules of .dependency-cruiser.cjs", () => {
  it.each(CLOSED_CASES)(
    "runs $rule at error for the closed $context context",
    ({ context, rule }) => {
      const found = ruleNamed(rule);
      expect(found.severity).toBe("error");
      expect(mentions(found, context)).toBe(true);
    }
  );

  it.each(CLOSED_CASES)(
    "keeps $rule at warn for a context whose series is still open, leaving $context to the error rule",
    ({ context, rule }) => {
      const found = ruleNamed(`${rule}${OPEN_SUFFIX}`);
      expect(found.severity).toBe("warn");
      // The open twin leaves the closed contexts to the error rule.
      expect(mentions(found, context)).toBe(true);
    }
  );

  it.each(CLOSED_CONTEXTS)(
    "names %s in no rule other than its boundary rules",
    (context) => {
      const boundaryNames = new Set<string>(
        BOUNDARY_RULES.flatMap((name) => [name, `${name}${OPEN_SUFFIX}`])
      );
      const others = config.forbidden
        .filter((rule) => !boundaryNames.has(rule.name))
        .filter((rule) => mentions(rule, context))
        .map((rule) => rule.name);
      expect(others).toEqual([]);
    }
  );
});

/**
 * Pins the shape of the context boundary rules in `.dependency-cruiser.cjs`
 * (ADR 0007, stage 3): a context whose move series has closed runs every
 * boundary rule at `error`, and every other context gets the same rules at
 * `warn`. The rules' effect on real imports is checked by `pnpm arch`
 * itself (its Red evidence is a deliberate violation, recorded in the
 * closing pull request of each series); this test guards against a later
 * edit that silently downgrades a closed context or forgets one of its rules.
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

/** The context the pilot series closed with CMB-08. */
const CLOSED_CONTEXT = "combos";

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

function patterns(matcher: PathMatcher): readonly string[] {
  return [matcher.path ?? [], matcher.pathNot ?? []].flatMap((value) =>
    typeof value === "string" ? [value] : [...value]
  );
}

function mentions(rule: ForbiddenRule, context: string): boolean {
  return [...patterns(rule.from), ...patterns(rule.to)].some((pattern) =>
    pattern.includes(`(${context})`)
  );
}

function ruleNamed(name: string): ForbiddenRule {
  const rule = config.forbidden.find((candidate) => candidate.name === name);
  if (rule === undefined) throw new Error(`No rule named ${name}`);
  return rule;
}

describe("the context boundary rules of .dependency-cruiser.cjs", () => {
  it.each(BOUNDARY_RULES)(
    "runs %s at error for the closed combos context",
    (name) => {
      const rule = ruleNamed(name);
      expect(rule.severity).toBe("error");
      expect(mentions(rule, CLOSED_CONTEXT)).toBe(true);
    }
  );

  it.each(BOUNDARY_RULES)(
    "keeps %s at warn for a context whose series is still open",
    (name) => {
      const rule = ruleNamed(`${name}${OPEN_SUFFIX}`);
      expect(rule.severity).toBe("warn");
      // The open twin leaves the closed contexts to the error rule.
      expect(mentions(rule, CLOSED_CONTEXT)).toBe(true);
    }
  );

  it("names no context in a rule other than its boundary rules", () => {
    const boundaryNames = new Set<string>(
      BOUNDARY_RULES.flatMap((name) => [name, `${name}${OPEN_SUFFIX}`])
    );
    const others = config.forbidden
      .filter((rule) => !boundaryNames.has(rule.name))
      .filter((rule) => mentions(rule, CLOSED_CONTEXT))
      .map((rule) => rule.name);
    expect(others).toEqual([]);
  });
});

// @vitest-environment node
/**
 * Pins the SonarCloud parity rules of `eslint.config.mjs` by linting small
 * component sources with the repository's own config. SonarCloud is advisory
 * (docs/engineering/quality-gate.md), so each rule it kept reporting on new
 * pull requests has an ESLint twin that fails `pnpm lint` locally:
 *
 * - `jsx-a11y/prefer-tag-over-role` (Sonar S6819): a `role` that a native
 *   element already carries, such as `<div role="dialog">`.
 *
 * The Node API ignores `eslint-suppressions.json`, so the baseline does not
 * hide anything here.
 */
import { ESLint } from "eslint";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/** The repository root, two levels above this file (`src/test/`). */
const REPO_ROOT = join(__dirname, "..", "..");

/** A component module under `src/components/`, where shipped UI lives. */
const COMPONENT_FILE = join(REPO_ROOT, "src/components/example/Example.tsx");

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: REPO_ROOT });
});

/** The rule ids ESLint reports for `source` linted as a component, in order. */
async function rulesReportedFor(source: string): Promise<readonly string[]> {
  const [result] = await eslint.lintText(source, { filePath: COMPONENT_FILE });
  return (result?.messages ?? []).map((message) => message.ruleId ?? "fatal");
}

describe("native elements over ARIA roles (Sonar S6819)", () => {
  it.each([
    ["dialog", "dialog"],
    ["group", "fieldset"],
    ["status", "output"],
  ])(
    'rejects <div role="%s">, which the native <%s> element already announces',
    async (role) => {
      const source = `export function Example() {\n  return <div role="${role}" />;\n}\n`;

      expect(await rulesReportedFor(source)).toEqual([
        "jsx-a11y/prefer-tag-over-role",
      ]);
    }
  );

  it("accepts the native element in place of the role", async () => {
    const source =
      'export function Example() {\n  return (\n    <dialog open aria-label="Share">\n      <output aria-live="polite">saved</output>\n    </dialog>\n  );\n}\n';

    expect(await rulesReportedFor(source)).toEqual([]);
  });

  it("accepts a role with no native element, such as a switch", async () => {
    const source =
      'export function Example() {\n  return <button type="button" role="switch" aria-checked="false" />;\n}\n';

    expect(await rulesReportedFor(source)).toEqual([]);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..");
const PROVIDER_ENDPOINT = /api\.anthropic\.com|api\.openai\.com/;

/**
 * Lists the production source files under a directory.
 *
 * @param dir - directory to walk
 * @returns paths of `.ts` and `.tsx` files that are not tests
 */
function sourceFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

// I-30 requirement 4.1: a model call made anywhere else would be unmetered,
// outside the allowance and invisible to the spend ceiling.
describe("metered model module", () => {
  it("is the only source file that calls a model provider endpoint", () => {
    const callers = sourceFiles(SRC)
      .filter((file) => PROVIDER_ENDPOINT.test(readFileSync(file, "utf8")))
      .map((file) => relative(SRC, file));

    expect(callers).toEqual([join("lib", "ai", "metered-model.ts")]);
  });
});

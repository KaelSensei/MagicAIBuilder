import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dependency manifest guards.
 *
 * The 3D spellbook landing page was replaced by a static marketing page in
 * #308, yet `three`, the React Three Fiber packages and `gsap` stayed declared
 * with no import anywhere. The I-13 visual direction replaces the 3D landing
 * instead of reviving it (`docs/product/specs/i13-visual-direction.md`), so a
 * re-added 3D package is either dead weight again or a decision that should
 * update that spec first.
 */

const ROOT = join(__dirname, "..", "..");

/** Packages of the retired 3D landing page. */
const RETIRED_3D_PACKAGES: readonly string[] = [
  "three",
  "@types/three",
  "@react-three/fiber",
  "@react-three/drei",
  "@react-three/postprocessing",
  "gsap",
];

/** @returns the keys of one dependency section, or none when it is absent */
function sectionKeys(section: unknown): readonly string[] {
  return typeof section === "object" && section !== null
    ? Object.keys(section)
    : [];
}

/** @returns every package name declared in the runtime and dev dependencies */
function declaredPackageNames(): ReadonlySet<string> {
  const manifest: unknown = JSON.parse(
    readFileSync(join(ROOT, "package.json"), "utf8")
  );
  if (typeof manifest !== "object" || manifest === null) return new Set();
  const runtime =
    "dependencies" in manifest ? manifest.dependencies : undefined;
  const dev =
    "devDependencies" in manifest ? manifest.devDependencies : undefined;
  return new Set([...sectionKeys(runtime), ...sectionKeys(dev)]);
}

describe("dependency manifest", () => {
  it("declares none of the retired 3D landing packages", () => {
    const declared = declaredPackageNames();
    expect(
      declared.has("next"),
      "package.json dependencies must be readable"
    ).toBe(true);

    expect(RETIRED_3D_PACKAGES.filter((name) => declared.has(name))).toEqual(
      []
    );
  });
});

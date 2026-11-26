/**
 * Test helper for the app's one keyboard-focus indicator.
 *
 * `src/styles/globals.css` draws a `--focus-ring` outline on every native
 * control from its base layer (design audit S1). jsdom does not load that
 * stylesheet, so a component test can only check that the control carries
 * no utility that removes the outline; `e2e/focus-visible.spec.ts` measures
 * the outline itself in a browser.
 *
 * @module test/focus-outline
 */

/**
 * Matches a class list that hides the base-layer outline: `outline-none`,
 * `focus:outline-none` or `focus-visible:outline-none`, as a whole class.
 */
export const HIDES_FOCUS_OUTLINE =
  /(?:^|\s)(?:focus:|focus-visible:)?outline-none(?:\s|$)/;

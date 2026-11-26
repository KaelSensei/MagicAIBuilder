/**
 * The app's one keyboard-focus indicator, as classes: a 2px solid outline in
 * `--focus-ring`, 2px outside the control.
 *
 * Shared kernel (app shell). `src/styles/globals.css` already draws this
 * outline on every native control from its base layer, so most controls carry
 * no focus class at all. These constants put it on the primitives explicitly,
 * because a utility such as a caller's `outline-none` outranks the base layer,
 * and on a shell that draws it around the field inside it.
 *
 * Why an outline: WCAG 2.2 SC 2.4.7 asks for a visible focus indicator
 * (https://www.w3.org/TR/WCAG22/#focus-visible) and SC 1.4.11 for 3:1 against
 * the surface (https://www.w3.org/TR/WCAG22/#non-text-contrast), both read
 * 2026-11-26; `src/styles/contrast.test.ts` holds `--focus-ring` to that 3:1.
 * Tailwind's `ring` is a box-shadow, which forced-colors mode removes, while
 * an outline stays
 * (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors,
 * read 2026-11-26).
 *
 * @module components/ui/focus
 */

/**
 * The focus outline of a control, on `:focus-visible`: keyboard focus, and
 * any focus of a text field, which browsers always treat as visible. A mouse
 * click on a button draws nothing. `outline-solid` restores the style even
 * when the control also carries `outline-none`.
 */
export const focusRingClassName =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

/**
 * The same outline on a shell while the field inside it has focus, mouse or
 * keyboard, for a field that hides its own outline so that the shell draws one
 * around the field and its icons.
 */
export const focusWithinRingClassName =
  "focus-within:outline-solid focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)]";

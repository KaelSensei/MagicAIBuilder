/**
 * Puts the keyboard focus back in the builder's search field.
 *
 * Builder search panel. An empty result's "Clear filters" removes itself once pressed, so focus
 * would fall to `<body>` and a keyboard player would lose their place (review of I-13 AC-13-05).
 * The field differs with the panel's state: the name search's text box, the plain-language
 * description while one is being described, or the set field when a picker runs on By Set. The
 * first enabled text field of the panel's controls is that field in every case.
 *
 * @module components/builder/focus-search-field
 */

/** The text fields a search is typed in; buttons, checkboxes and number fields are skipped. */
const SEARCH_FIELD =
  "input[type='text']:enabled, input:not([type]):enabled, textarea:enabled";

/**
 * Focuses the first enabled text field inside `controls`.
 *
 * @param controls - the search panel's controls, or null before they mount
 */
export function focusSearchField(controls: HTMLElement | null): void {
  controls?.querySelector<HTMLElement>(SEARCH_FIELD)?.focus();
}

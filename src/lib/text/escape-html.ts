/**
 * Text made safe to place in an HTML document the app builds as a string.
 *
 * Shared kernel, pure. The decklist registration sheet and the proxy print
 * sheet escape every card and deck text through it, so a name with `&`, `<`
 * or quotes prints as typed.
 * Not responsible for: URLs or script content, which need their own encoding.
 *
 * @module text/escape-html
 */

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * `text` with `&`, `<`, `>`, `"` and `'` replaced by their entities, safe in
 * element content and in a quoted attribute value.
 *
 * @param text - any text, as the player typed or stored it
 * @returns the escaped text; text without those characters is unchanged
 */
export function escapeHtml(text: string): string {
  return text.replaceAll(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character] ?? character
  );
}

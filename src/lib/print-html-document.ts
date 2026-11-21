/**
 * Opens the browser's print dialog on an HTML document the app built, alone,
 * with none of the app around it.
 *
 * Shared kernel, browser only: it needs `document` and an iframe's window.
 * The decklist registration sheet prints through it. The document goes into a
 * hidden, same-origin iframe, so no pop-up blocker can stop it, and the
 * iframe leaves the page once the player closes the dialog. Not responsible
 * for: building the document, or the proxy sheets, which open a window of
 * their own to wait for their images.
 *
 * @module print-html-document
 */

// Off-screen and zero-sized rather than `display: none`, which some browsers
// refuse to print.
const HIDDEN_FRAME_STYLE =
  "position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: 0;";

/** Removes the iframe once its print dialog closes. */
function removeAfterPrint(frame: HTMLIFrameElement, view: Window): void {
  view.addEventListener("afterprint", () => frame.remove(), { once: true });
}

/**
 * Prints `html` as its own page: the browser's print dialog shows that
 * document only, with its own `<title>`, styles and `lang`.
 *
 * Nothing is returned; the browser owns the dialog. If the iframe has no
 * window, as in a document without a browsing context, it does nothing.
 *
 * @param html - a complete HTML document, `<!DOCTYPE html>` included, whose
 *   text is already escaped
 */
export function printHtmlDocument(html: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = HIDDEN_FRAME_STYLE;
  document.body.append(frame);
  const view = frame.contentWindow;
  const page = frame.contentDocument;
  if (!view || !page) {
    frame.remove();
    return;
  }
  const parsed = new DOMParser().parseFromString(html, "text/html");
  page.replaceChild(
    page.importNode(parsed.documentElement, true),
    page.documentElement
  );
  removeAfterPrint(frame, view);
  view.focus();
  view.print();
}

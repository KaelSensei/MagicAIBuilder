/**
 * Saves text the app built in the browser as a file on the player's device.
 *
 * Shared kernel, browser only: it needs `document` and `URL.createObjectURL`.
 * The deck export, the playtest log, the collection and acquisition-plan CSVs,
 * the shopping lists and the token checklist all save through it.
 * Not responsible for: building the text, which each export does itself, or
 * the proxy print sheet, which opens a print window instead of saving a file.
 *
 * @module download-text-file
 */

/**
 * Starts a download of `content` as a file named `filename`.
 *
 * The browser decides where the file goes; nothing is returned or awaited.
 * The temporary link joins the document only for the click and the object URL
 * is released right after it, so repeated exports leak neither.
 *
 * @param filename - The suggested file name, extension included.
 * @param mimeType - The file's MIME type, a charset parameter included when
 *   the caller wants one; plain text when omitted.
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = "text/plain"
): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  // Firefox before 70 ignored a click on a link outside the document
  // (https://bugzilla.mozilla.org/show_bug.cgi?id=1218456, read 2026-11-11).
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

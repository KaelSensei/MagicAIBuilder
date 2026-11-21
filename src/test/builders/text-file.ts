/**
 * Test data builder for a file the player chooses in a file input.
 *
 * Browsers give every `File` a `text()` method; jsdom 26, the test DOM, does
 * not implement `Blob.prototype.text` (`node_modules/jsdom/lib/jsdom/living/file-api/Blob-impl.js`,
 * checked 2026-11-21). This builder adds it, answering with the content, so
 * the code under test reads the file the way a browser lets it.
 *
 * @module test/builders/text-file
 */

/** Options for {@link aTextFile}. */
export interface TextFileOptions {
  /** Called each time the file is read, to prove a file was, or was not, read. */
  readonly onRead?: () => void;
}

/**
 * A `File` named `name` holding `content`, whose `text()` answers `content`.
 *
 * @param name - the file name, extension included (`atraxa.txt`)
 * @param content - the file's text; its UTF-8 length is the file's `size`
 * @param options - an `onRead` spy
 */
export function aTextFile(name: string, content: string, options: TextFileOptions = {}): File {
  const file = new File([content], name);
  Object.defineProperty(file, "text", {
    value: () => {
      options.onRead?.();
      return Promise.resolve(content);
    },
  });
  return file;
}

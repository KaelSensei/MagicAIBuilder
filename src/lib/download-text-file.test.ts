import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadTextFile } from "./download-text-file";

/** What the link looked like at the moment it was clicked. */
interface ClickedLink {
  readonly href: string;
  readonly download: string;
  readonly inDocument: boolean;
}

const OBJECT_URL = "blob:download-text-file";

let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;
let clicks: ClickedLink[];
let click: ReturnType<typeof vi.spyOn>;

/** @returns the Blob handed to `URL.createObjectURL` by the last download */
function savedBlob(): Blob {
  const blob: unknown = createObjectURL.mock.calls[0]?.[0];
  if (!(blob instanceof Blob)) throw new Error("No Blob was created");
  return blob;
}

/** @returns the Blob's text, read the way a browser would save it */
function readText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  createObjectURL = vi.fn().mockReturnValue(OBJECT_URL);
  revokeObjectURL = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });
  clicks = [];
  click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function (this: HTMLAnchorElement) {
      clicks.push({
        href: this.href,
        download: this.download,
        inDocument: document.body.contains(this),
      });
    });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("downloadTextFile", () => {
  it("offers the content as a file under the given name with one click", () => {
    downloadTextFile("1 Sol Ring", "deck.txt", "text/plain");

    expect(clicks).toEqual([
      { href: OBJECT_URL, download: "deck.txt", inDocument: true },
    ]);
  });

  it("saves the content unchanged, labelled with the given MIME type", async () => {
    downloadTextFile(
      '"Sol Ring",1',
      "my-collection.csv",
      "text/csv;charset=utf-8"
    );

    const blob = savedBlob();
    expect(blob.type).toBe("text/csv;charset=utf-8");
    expect(await readText(blob)).toBe('"Sol Ring",1');
  });

  it("labels the file text/plain when no MIME type is given", () => {
    downloadTextFile("1 Sol Ring", "deck.txt");

    expect(savedBlob().type).toBe("text/plain");
  });

  it("removes the link from the document after the click", () => {
    downloadTextFile("1 Sol Ring", "deck.txt");

    expect(clicks[0]?.inDocument).toBe(true);
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("releases the object URL once the download has started", () => {
    downloadTextFile("1 Sol Ring", "deck.txt");

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
    const clickedAt = click.mock.invocationCallOrder[0] ?? Infinity;
    const revokedAt = revokeObjectURL.mock.invocationCallOrder[0] ?? -Infinity;
    expect(revokedAt).toBeGreaterThan(clickedAt);
  });
});

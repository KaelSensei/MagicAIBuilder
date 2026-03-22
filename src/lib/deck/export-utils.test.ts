import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard, downloadFile } from "./export";

describe("copyToClipboard", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls navigator.clipboard.writeText with the text", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    await copyToClipboard("hello world");
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello world");
  });

  it("propagates clipboard errors", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
      new Error("Not allowed")
    );
    await expect(copyToClipboard("text")).rejects.toThrow("Not allowed");
  });
});

describe("downloadFile", () => {
  let clickFn: ReturnType<typeof vi.fn>;
  let fakeAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let appendedChildren: Node[];
  let removedChildren: Node[];

  beforeEach(() => {
    clickFn = vi.fn();
    fakeAnchor = { href: "", download: "", click: clickFn, remove: vi.fn() };

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return fakeAnchor as unknown as HTMLElement;
      return document.createElement(tag);
    });

    appendedChildren = [];
    removedChildren = [];
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      appendedChildren.push(node);
      return node;
    });
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => {
      removedChildren.push(node);
      return node;
    });

    // Stub URL methods that don't exist in jsdom
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates an anchor element and clicks it", () => {
    downloadFile("content", "deck.txt");
    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(clickFn).toHaveBeenCalled();
  });

  it("sets the correct download filename", () => {
    downloadFile("content", "my-deck.txt");
    expect(fakeAnchor.download).toBe("my-deck.txt");
  });

  it("sets href to the blob URL", () => {
    downloadFile("content", "deck.txt");
    expect(fakeAnchor.href).toBe("blob:test");
  });

  it("appends the anchor to body and removes it", () => {
    downloadFile("content", "deck.txt");
    expect(appendedChildren[0]).toBe(fakeAnchor);
    expect(fakeAnchor.remove).toHaveBeenCalled();
  });

  it("revokes the object URL after download", () => {
    downloadFile("content", "deck.txt");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });

  it("creates a Blob for the content", () => {
    downloadFile("content", "deck.txt");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it("uses custom mime type when provided", () => {
    downloadFile("<xml/>", "deck.dek", "application/xml");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });
});

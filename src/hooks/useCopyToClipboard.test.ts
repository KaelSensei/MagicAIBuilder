import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "./useCopyToClipboard";

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns [false, copy] initially", () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [copied] = result.current;
    expect(copied).toBe(false);
  });

  it("sets copied to true after successful copy", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[1]("hello");
    });

    expect(result.current[0]).toBe(true);
  });

  it("calls navigator.clipboard.writeText with the correct text", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[1]("test text");
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test text");
  });

  it("resets copied to false after 2 seconds", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[1]("hello");
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current[0]).toBe(false);
  });

  it("does not reset before 2 seconds", async () => {
    vi.mocked(navigator.clipboard.writeText).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[1]("hello");
    });

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(result.current[0]).toBe(true);
  });

  it("silently ignores clipboard errors", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
      new Error("Not allowed")
    );
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current[1]("hello");
    });

    // copied stays false on error
    expect(result.current[0]).toBe(false);
  });
});

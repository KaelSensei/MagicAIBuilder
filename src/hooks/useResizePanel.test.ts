import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResizePanel } from "./useResizePanel";

describe("useResizePanel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with initialWidth", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300 })
    );
    expect(result.current.width).toBe(300);
  });

  it("loads width from localStorage when storageKey provided", () => {
    localStorage.setItem("panel-width", "400");
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, storageKey: "panel-width" })
    );
    expect(result.current.width).toBe(400);
  });

  it("clamps stored value to minWidth", () => {
    localStorage.setItem("panel-width", "50");
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600, storageKey: "panel-width" })
    );
    expect(result.current.width).toBe(200);
  });

  it("clamps stored value to maxWidth", () => {
    localStorage.setItem("panel-width", "900");
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600, storageKey: "panel-width" })
    );
    expect(result.current.width).toBe(600);
  });

  it("uses initialWidth when no stored value", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 350, storageKey: "missing-key" })
    );
    expect(result.current.width).toBe(350);
  });

  it("saves width to localStorage on change via keyboard", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600, storageKey: "panel-width" })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(localStorage.getItem("panel-width")).toBe("310");
  });

  it("ArrowRight increases width by 10", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.width).toBe(310);
  });

  it("ArrowLeft decreases width by 10", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowLeft",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.width).toBe(290);
  });

  it("ArrowLeft does not go below minWidth", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 205, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowLeft",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.width).toBe(200);
  });

  it("ArrowRight does not go above maxWidth", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 595, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.width).toBe(600);
  });

  it("other keys do not change width", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.width).toBe(300);
  });

  it("returns handleMouseDown function", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300 })
    );
    expect(typeof result.current.handleMouseDown).toBe("function");
  });
});

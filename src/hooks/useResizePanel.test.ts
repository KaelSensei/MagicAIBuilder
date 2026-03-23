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

  it("handleMouseDown sets cursor style to col-resize", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
    });

    expect(document.body.style.cursor).toBe("col-resize");
  });

  it("mousemove event updates width based on delta", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    // Start dragging from x=100
    act(() => {
      result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
    });

    // Move mouse 50px to the right
    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));
    });

    expect(result.current.width).toBe(350);
  });

  it("mousemove clamps to maxWidth", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 580, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 200 }));
    });

    expect(result.current.width).toBe(600);
  });

  it("mousemove clamps to minWidth", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 210, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: -100 }));
    });

    expect(result.current.width).toBe(200);
  });

  it("mouseup stops dragging and resets cursor", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(document.body.style.cursor).toBe("");
  });

  it("mouseup saves width to localStorage when storageKey provided", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600, storageKey: "resize-test" })
    );

    act(() => {
      result.current.handleMouseDown({ clientX: 100 } as React.MouseEvent);
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));
    });

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mouseup"));
    });

    // localStorage is updated by the width-change effect
    expect(localStorage.getItem("resize-test")).toBeTruthy();
  });

  it("mousemove does nothing when not dragging", () => {
    const { result } = renderHook(() =>
      useResizePanel({ initialWidth: 300, minWidth: 200, maxWidth: 600 })
    );

    act(() => {
      globalThis.dispatchEvent(new MouseEvent("mousemove", { clientX: 500 }));
    });

    expect(result.current.width).toBe(300);
  });
});

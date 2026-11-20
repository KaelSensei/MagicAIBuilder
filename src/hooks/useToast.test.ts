import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToastStore, useToast } from "./useToast";

/** Dismisses every toast through the store, so no auto-close timer outlives its test. */
function dismissAll(): void {
  const { toasts, remove } = useToastStore.getState();
  for (const toast of toasts) remove(toast.id);
}

afterEach(() => {
  dismissAll();
  vi.useRealTimers();
});

/** The messages the store holds. */
function storedMessages(): readonly unknown[] {
  return useToastStore.getState().toasts.map((toast) => toast.message);
}

describe("useToastStore — reading time", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  it.each(["success", "info", "warning"] as const)(
    "closes a %s toast after eight seconds, not before",
    (type) => {
      useToastStore.getState().add(type, "Read me");

      vi.advanceTimersByTime(7_999);
      expect(storedMessages()).toEqual(["Read me"]);

      vi.advanceTimersByTime(1);
      expect(storedMessages()).toEqual([]);
    }
  );

  it("keeps an error toast until the player dismisses it", () => {
    useToastStore.getState().add("error", "Save failed");

    vi.advanceTimersByTime(60_000);

    expect(storedMessages()).toEqual(["Save failed"]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("leaves no timer running once a toast is dismissed", () => {
    useToastStore.getState().add("success", "Deck saved");
    const [toast] = useToastStore.getState().toasts;

    useToastStore.getState().remove(toast.id);

    expect(storedMessages()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not close a held toast, and gives it a fresh eight seconds once released", () => {
    useToastStore.getState().add("info", "Undo applied");
    const [toast] = useToastStore.getState().toasts;
    vi.advanceTimersByTime(5_000);

    useToastStore.getState().hold(toast.id);
    vi.advanceTimersByTime(30_000);
    expect(storedMessages()).toEqual(["Undo applied"]);

    useToastStore.getState().release(toast.id);
    vi.advanceTimersByTime(7_999);
    expect(storedMessages()).toEqual(["Undo applied"]);
    vi.advanceTimersByTime(1);
    expect(storedMessages()).toEqual([]);
  });

  it("starts no timer when a toast already removed is released", () => {
    useToastStore.getState().add("success", "Deck saved");
    const [toast] = useToastStore.getState().toasts;
    useToastStore.getState().remove(toast.id);

    useToastStore.getState().release(toast.id);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("closes each of two toasts raised together on its own timer", () => {
    useToastStore.getState().add("error", "Save failed");
    useToastStore.getState().add("success", "Deck saved");

    vi.advanceTimersByTime(8_000);

    expect(storedMessages()).toEqual(["Save failed"]);
  });
});

describe("useToastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("starts with no toasts", () => {
    const { result } = renderHook(() => useToastStore());
    expect(result.current.toasts).toHaveLength(0);
  });

  it("adds a toast", () => {
    const { result } = renderHook(() => useToastStore());
    act(() => { result.current.add("success", "It worked!"); });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe("success");
    expect(result.current.toasts[0].message).toBe("It worked!");
  });

  it("removes a toast by id", () => {
    const { result } = renderHook(() => useToastStore());
    act(() => { result.current.add("info", "Hello"); });
    const id = result.current.toasts[0].id;
    act(() => { result.current.remove(id); });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("assigns unique ids to toasts", () => {
    const { result } = renderHook(() => useToastStore());
    act(() => {
      result.current.add("success", "First");
      result.current.add("error", "Second");
    });
    const ids = result.current.toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("supports all toast types", () => {
    const { result } = renderHook(() => useToastStore());
    act(() => {
      result.current.add("success", "s");
      result.current.add("error", "e");
      result.current.add("warning", "w");
      result.current.add("info", "i");
    });
    const types = result.current.toasts.map((t) => t.type);
    expect(types).toContain("success");
    expect(types).toContain("error");
    expect(types).toContain("warning");
    expect(types).toContain("info");
  });
});

describe("useToast", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("adds success toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.success("Done!"); });
    expect(useToastStore.getState().toasts[0].type).toBe("success");
    expect(useToastStore.getState().toasts[0].message).toBe("Done!");
  });

  it("adds error toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.error("Oops!"); });
    expect(useToastStore.getState().toasts[0].type).toBe("error");
  });

  it("adds warning toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.warning("Watch out!"); });
    expect(useToastStore.getState().toasts[0].type).toBe("warning");
  });

  it("adds info toast", () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.info("FYI"); });
    expect(useToastStore.getState().toasts[0].type).toBe("info");
  });

  it("exposes toast as direct add function", () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.toast("success", "Direct"); });
    expect(useToastStore.getState().toasts[0].message).toBe("Direct");
  });
});

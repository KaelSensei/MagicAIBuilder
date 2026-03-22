import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToastStore, useToast } from "./useToast";

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

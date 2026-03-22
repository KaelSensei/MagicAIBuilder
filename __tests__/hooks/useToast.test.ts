import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToastStore } from "@/hooks/useToast";

describe("useToastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with no toasts", () => {
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("adds a toast with type and message", () => {
    useToastStore.getState().add("success", "Done!");
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("success");
    expect(toasts[0].message).toBe("Done!");
    expect(typeof toasts[0].id).toBe("string");
  });

  it("adds multiple toasts", () => {
    useToastStore.getState().add("success", "One");
    useToastStore.getState().add("error", "Two");
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it("removes a toast by id", () => {
    useToastStore.getState().add("info", "Hello");
    const { toasts } = useToastStore.getState();
    const id = toasts[0].id;
    useToastStore.getState().remove(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("auto-dismisses non-warning toasts after 3s", () => {
    useToastStore.getState().add("success", "Auto dismiss");
    expect(useToastStore.getState().toasts).toHaveLength(1);
    vi.advanceTimersByTime(3001);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("auto-dismisses warning toasts after 5s", () => {
    useToastStore.getState().add("warning", "Long warning");
    vi.advanceTimersByTime(3001);
    expect(useToastStore.getState().toasts).toHaveLength(1); // still present after 3s
    vi.advanceTimersByTime(2001);
    expect(useToastStore.getState().toasts).toHaveLength(0); // gone after 5s
  });

  it("each toast has a unique id", () => {
    useToastStore.getState().add("info", "A");
    useToastStore.getState().add("info", "B");
    const { toasts } = useToastStore.getState();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it("supports all toast types", () => {
    const types = ["success", "error", "warning", "info"] as const;
    for (const type of types) {
      useToastStore.getState().add(type, `${type} message`);
    }
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(4);
  });
});

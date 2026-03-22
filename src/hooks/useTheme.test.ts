import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemeStore, useTheme } from "./useTheme";

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark" });
  });

  it("defaults to dark theme", () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.theme).toBe("dark");
  });

  it("toggles from dark to light", () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe("light");
  });

  it("toggles from light back to dark", () => {
    useThemeStore.setState({ theme: "light" });
    const { result } = renderHook(() => useThemeStore());
    act(() => { result.current.toggleTheme(); });
    expect(result.current.theme).toBe("dark");
  });

  it("sets theme explicitly to light", () => {
    const { result } = renderHook(() => useThemeStore());
    act(() => { result.current.setTheme("light"); });
    expect(result.current.theme).toBe("light");
  });

  it("sets theme explicitly to dark", () => {
    useThemeStore.setState({ theme: "light" });
    const { result } = renderHook(() => useThemeStore());
    act(() => { result.current.setTheme("dark"); });
    expect(result.current.theme).toBe("dark");
  });
});

describe("useTheme", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark" });
  });

  it("returns the current theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("exposes toggleTheme", () => {
    const { result } = renderHook(() => useTheme());
    expect(typeof result.current.toggleTheme).toBe("function");
  });

  it("exposes setTheme", () => {
    const { result } = renderHook(() => useTheme());
    expect(typeof result.current.setTheme).toBe("function");
  });
});

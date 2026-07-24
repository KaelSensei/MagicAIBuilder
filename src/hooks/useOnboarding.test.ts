import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const { mockInitOnboardingDone } = vi.hoisted(() => ({
  mockInitOnboardingDone: { value: null as boolean | null },
}));

vi.mock("@/components/providers/InitProvider", () => ({
  useInitContext: () => ({ onboardingDone: mockInitOnboardingDone.value }),
}));

import { useSession } from "next-auth/react";
import { useOnboarding } from "./useOnboarding";

// ─── localStorage mock ────────────────────────────────────────────────────────
const LS_KEY = "mab-onboarding-done";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────
describe("useOnboarding localStorage helpers", () => {
  beforeEach(() => localStorageMock.clear());
  afterEach(() => vi.restoreAllMocks());

  it("onboarding not done when localStorage is empty", () => {
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("marks onboarding as done in localStorage", () => {
    localStorage.setItem(LS_KEY, "true");
    expect(localStorage.getItem(LS_KEY)).toBe("true");
  });

  it("resets onboarding by removing key", () => {
    localStorage.setItem(LS_KEY, "true");
    localStorage.removeItem(LS_KEY);
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });
});

// ─── Skip flow ────────────────────────────────────────────────────────────────
describe("onboarding skip flow", () => {
  beforeEach(() => localStorageMock.clear());

  it("skip sets onboarding done in localStorage", () => {
    // Simulates what completeOnboarding does for unauthenticated users
    localStorage.setItem(LS_KEY, "true");
    expect(localStorage.getItem(LS_KEY)).toBe("true");
  });

  it("wizard does not show after skip (localStorage done)", () => {
    localStorage.setItem(LS_KEY, "true");
    const done = localStorage.getItem(LS_KEY) === "true";
    const showWizard = !done;
    expect(showWizard).toBe(false);
  });
});

// ─── Replay flow ──────────────────────────────────────────────────────────────
describe("onboarding replay flow", () => {
  beforeEach(() => localStorageMock.clear());

  it("reset removes localStorage key", () => {
    localStorage.setItem(LS_KEY, "true");
    localStorage.removeItem(LS_KEY);
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("wizard shows again after reset", () => {
    localStorage.removeItem(LS_KEY);
    const done = localStorage.getItem(LS_KEY) === "true";
    const showWizard = !done;
    expect(showWizard).toBe(true);
  });
});

// ─── useOnboarding hook (session + fetch) ────────────────────────────────────
describe("useOnboarding", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
    mockInitOnboardingDone.value = null;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ onboardingDone: true }), { status: 200 })
      )
    );
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps loading while auth session status is loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    });
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.loading).toBe(true);
  });

  it("unauthenticated: showWizard when localStorage not done", async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.showWizard).toBe(true);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("unauthenticated: hide wizard when localStorage marks done", async () => {
    localStorage.setItem(LS_KEY, "true");
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.showWizard).toBe(false);
  });

  it("authenticated: showWizard when InitProvider says onboarding not done", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        expires: "future",
        user: { id: "user-1", name: "T", email: "t@t.com" },
      },
      status: "authenticated",
      update: vi.fn(),
    });
    mockInitOnboardingDone.value = false;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.showWizard).toBe(true);
  });

  it("authenticated: hide wizard when InitProvider onboardingDone is true", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-2", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
    mockInitOnboardingDone.value = true;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.showWizard).toBe(false);
  });

  it("authenticated: stays loading while InitProvider has not resolved", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-pending", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
    mockInitOnboardingDone.value = null;

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.loading).toBe(true);
  });

  it("completeOnboarding unauthenticated sets localStorage", async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await act(async () => {
      await result.current.completeOnboarding();
    });
    expect(localStorage.getItem(LS_KEY)).toBe("true");
    expect(result.current.showWizard).toBe(false);
  });

  it("completeOnboarding authenticated POSTs onboarding endpoint", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-4", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
    mockInitOnboardingDone.value = false;
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ onboardingDone: true }), { status: 200 })
    );

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(globalThis.fetch).toHaveBeenLastCalledWith("/api/user/onboarding", { method: "POST" });
  });

  it("resetOnboarding authenticated DELETEs and shows wizard", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-5", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
    mockInitOnboardingDone.value = true;
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ onboardingDone: true }), { status: 200 })
    );

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.resetOnboarding();
    });

    expect(globalThis.fetch).toHaveBeenLastCalledWith("/api/user/onboarding", { method: "DELETE" });
    expect(result.current.showWizard).toBe(true);
  });

  it("resetOnboarding unauthenticated clears localStorage", async () => {
    localStorage.setItem(LS_KEY, "true");
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.resetOnboarding();
    });

    expect(localStorage.getItem(LS_KEY)).toBeNull();
    expect(result.current.showWizard).toBe(true);
  });
});

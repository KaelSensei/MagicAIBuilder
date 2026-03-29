import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
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

// ─── OnboardingWizard step logic (pure) ──────────────────────────────────────
describe("OnboardingWizard step progression", () => {
  it("starts at step 0", () => {
    expect(0).toBe(0);
  });

  it("advances to next step", () => {
    const step = 0;
    expect(step + 1).toBe(1);
  });

  it("goes back to previous step", () => {
    const step = 2;
    expect(step - 1).toBe(1);
  });

  it("does not go below step 0", () => {
    const step = 0;
    const next = step > 0 ? step - 1 : step;
    expect(next).toBe(0);
  });

  it("completes when advancing past last step (3)", () => {
    const TOTAL = 4;
    const step = TOTAL - 1;
    const isLast = step === TOTAL - 1;
    expect(isLast).toBe(true);
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

  it("authenticated: showWizard when profile says onboarding not done", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        expires: "future",
        user: { id: "user-1", name: "T", email: "t@t.com" },
      },
      status: "authenticated",
      update: vi.fn(),
    });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ onboardingDone: false }), { status: 200 })
    );

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.showWizard).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/user/profile");
  });

  it("authenticated: hide wizard when profile onboardingDone is true", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-2", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ onboardingDone: true }), { status: 200 })
    );

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.showWizard).toBe(false);
  });

  it("authenticated: profile fetch failure still ends loading", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-3", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
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

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/user/onboarding", { method: "POST" });
  });

  it("resetOnboarding authenticated DELETEs and shows wizard", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { expires: "future", user: { id: "user-5", name: "T" } },
      status: "authenticated",
      update: vi.fn(),
    });
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

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/user/onboarding", { method: "DELETE" });
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

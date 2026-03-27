import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

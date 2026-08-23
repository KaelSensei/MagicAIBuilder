import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollReveal } from "./useScrollReveal";

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

/** The callback the hook handed to the observer, captured per test. */
let capturedCallback: ObserverCallback | undefined;
const observe = vi.fn();
const disconnect = vi.fn();

/**
 * A minimal IntersectionObserver.
 *
 * jsdom ships none at all, so without this the hook throws on the first render
 * — which is one reason it had no test: it cannot be rendered as-is.
 */
class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    capturedCallback = callback;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
  takeRecords = vi.fn();
}

function entryFor(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return { target, isIntersecting } as IntersectionObserverEntry;
}

function addRevealElements(count: number): HTMLElement[] {
  return Array.from({ length: count }, () => {
    const el = document.createElement("div");
    el.className = "reveal";
    document.body.appendChild(el);
    return el;
  });
}

/**
 * The landing page's scroll-in animation.
 *
 * The observable behaviour is a class arriving on an element after a delay
 * proportional to its position in the batch, which no page assertion can
 * distinguish from "the animation is just slow" — so the stagger and the
 * teardown are asserted here rather than in the browser.
 */
describe("useScrollReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    capturedCallback = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("observes every .reveal element and nothing else", () => {
    const revealed = addRevealElements(3);
    const ignored = document.createElement("div");
    document.body.appendChild(ignored);

    renderHook(() => useScrollReveal());

    expect(observe).toHaveBeenCalledTimes(3);
    for (const el of revealed) expect(observe).toHaveBeenCalledWith(el);
    expect(observe).not.toHaveBeenCalledWith(ignored);
  });

  it("staggers the reveal by 80ms per element in the batch", () => {
    const [first, second] = addRevealElements(2);
    renderHook(() => useScrollReveal());

    capturedCallback?.([entryFor(first, true), entryFor(second, true)]);

    vi.advanceTimersByTime(0);
    expect(first.classList.contains("visible")).toBe(true);
    expect(second.classList.contains("visible")).toBe(false);

    vi.advanceTimersByTime(80);
    expect(second.classList.contains("visible")).toBe(true);
  });

  it("leaves an element alone until it intersects", () => {
    const [el] = addRevealElements(1);
    renderHook(() => useScrollReveal());

    capturedCallback?.([entryFor(el, false)]);
    vi.advanceTimersByTime(1000);

    expect(el.classList.contains("visible")).toBe(false);
  });

  it("disconnects the observer on unmount", () => {
    addRevealElements(1);
    const { unmount } = renderHook(() => useScrollReveal());
    // React may mount the effect more than once; only the delta on unmount
    // says whether the hook cleans up after itself.
    const before = disconnect.mock.calls.length;

    unmount();

    expect(disconnect.mock.calls.length).toBe(before + 1);
  });
});

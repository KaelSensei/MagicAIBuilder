"use client";

import { useEffect } from "react";

/** Stagger delay between elements becoming visible (ms) */
const STAGGER_DELAY_MS = 80;

/** Reveals an element by adding the `.visible` class after a stagger delay */
function revealEntry(entry: IntersectionObserverEntry, index: number): void {
  if (entry.isIntersecting) {
    setTimeout(() => entry.target.classList.add("visible"), index * STAGGER_DELAY_MS);
  }
}

/** Observer callback — iterates entries and staggers reveal */
function handleIntersection(entries: IntersectionObserverEntry[]): void {
  entries.forEach((entry, i) => revealEntry(entry, i));
}

/**
 * Observes all `.reveal` elements and adds `.visible` on scroll intersection.
 * Elements cascade in with staggered timing.
 */
export function useScrollReveal(): void {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

"use client";

import { useEffect } from "react";

/** Stagger delay between elements becoming visible (ms) */
const STAGGER_DELAY_MS = 80;

/**
 * Observes all `.reveal` elements and adds `.visible` on scroll intersection.
 * Elements cascade in with staggered timing.
 */
export function useScrollReveal(): void {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(
              () => entry.target.classList.add("visible"),
              i * STAGGER_DELAY_MS
            );
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

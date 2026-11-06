"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizePanelOptions {
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

interface StoredWidthBounds {
  readonly minWidth: number;
  readonly maxWidth: number;
  readonly fallback: number;
}

/**
 * Reads a persisted panel width, ignoring values that are not integers.
 *
 * `parseInt` of a corrupt entry is `NaN`, and `Math.min`/`Math.max` propagate
 * that into a panel with no width. A bad entry falls back to the default and
 * is clamped only when the number is real.
 *
 * @param stored - raw localStorage value, or null when the key is absent
 * @param bounds - inclusive limits and the width to use when parsing fails
 * @returns a finite width inside the bounds
 */
export function readStoredPanelWidth(
  stored: string | null,
  bounds: StoredWidthBounds
): number {
  if (stored === null || stored.length === 0) return bounds.fallback;
  const parsed = Number.parseInt(stored, 10);
  if (!Number.isFinite(parsed)) return bounds.fallback;
  return Math.max(bounds.minWidth, Math.min(bounds.maxWidth, parsed));
}

/**
 * Tracks a resizable panel width, persisted when a storage key is given.
 *
 * @param options - starting width, limits, and optional localStorage key
 * @returns the width plus pointer and keyboard handlers
 */
export function useResizePanel({
  initialWidth,
  minWidth = 200,
  maxWidth = 600,
  storageKey,
}: UseResizePanelOptions) {
  const [width, setWidth] = useState(() => {
    if (!storageKey || globalThis.window === undefined) return initialWidth;
    return readStoredPanelWidth(localStorage.getItem(storageKey), {
      minWidth,
      maxWidth,
      fallback: initialWidth,
    });
  });

  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // The effect below already stored the live width. Writing
      // startWidth here would put the pre-drag size back.
    };

    globalThis.addEventListener("mousemove", handleMouseMove);
    globalThis.addEventListener("mouseup", handleMouseUp);
    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove);
      globalThis.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minWidth, maxWidth, storageKey]);

  // Save on width change
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(width));
  }, [width, storageKey]);

  /** Keyboard handler: ArrowLeft/ArrowRight resize by 10px steps */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const STEP = 10;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setWidth((w) => Math.max(minWidth, w - STEP));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setWidth((w) => Math.min(maxWidth, w + STEP));
    }
  }, [minWidth, maxWidth]);

  return { width, handleMouseDown, handleKeyDown };
}

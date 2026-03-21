"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseResizePanelOptions {
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function useResizePanel({
  initialWidth,
  minWidth = 200,
  maxWidth = 600,
  storageKey,
}: UseResizePanelOptions) {
  const [width, setWidth] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) return Math.max(minWidth, Math.min(maxWidth, Number.parseInt(stored, 10)));
    }
    return initialWidth;
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
      if (storageKey) {
        localStorage.setItem(storageKey, String(startWidth.current));
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
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

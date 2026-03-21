"use client";
// Hover tooltip with card details — follows mouse cursor
import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { DeckCard } from "@/lib/deck/types";

const TOOLTIP_WIDTH = 223;
const TOOLTIP_HEIGHT = 334; // image 310 + price row
const OFFSET_X = 16;

interface CardTooltipProps {
  readonly card: DeckCard;
  readonly children: React.ReactNode;
}

export function CardTooltip({ card, children }: CardTooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computePos = useCallback((e: React.MouseEvent) => {
    const x = Math.min(e.clientX + OFFSET_X, window.innerWidth - TOOLTIP_WIDTH - 8);
    const y = Math.min(
      Math.max(e.clientY - TOOLTIP_HEIGHT / 2, 8),
      window.innerHeight - TOOLTIP_HEIGHT - 8
    );
    return { x, y };
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      const p = computePos(e);
      timerRef.current = setTimeout(() => setPos(p), 300);
    },
    [computePos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (pos) setPos(computePos(e));
    },
    [pos, computePos]
  );

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPos(null);
  }, []);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {children}
      {pos &&
        createPortal(
          <div
            className="fixed z-9999 pointer-events-none rounded-lg overflow-hidden shadow-2xl border border-(--border)"
            style={{ left: pos.x, top: pos.y }}
          >
            <Image src={card.imageUri} alt={card.name} width={223} height={310} unoptimized />
            {card.price != null && (
              <div className="p-2 bg-(--surface) text-xs text-(--text-secondary)">
                <span className="text-(--accent)">${card.price.toFixed(2)}</span>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

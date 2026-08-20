"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { CollectionCard } from "@/lib/collection/types";

const TOOLTIP_WIDTH = 223;
const TOOLTIP_HEIGHT = 334; // image 310 + price row
const OFFSET_X = 16;

interface CollectionCardTooltipProps {
  readonly card: Pick<CollectionCard, "imageUri" | "name" | "price">;
  readonly children: React.ReactNode;
}

export function CollectionCardTooltip({ card, children }: CollectionCardTooltipProps) {
  const t = useTranslations("card");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computePos = useCallback((e: React.MouseEvent) => {
    const x = Math.min(e.clientX + OFFSET_X, globalThis.innerWidth - TOOLTIP_WIDTH - 8);
    const y = Math.min(
      Math.max(e.clientY - TOOLTIP_HEIGHT / 2, 8),
      globalThis.innerHeight - TOOLTIP_HEIGHT - 8
    );
    return { x, y };
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (!card.imageUri) return;
      const p = computePos(e);
      timerRef.current = setTimeout(() => setPos(p), 250);
    },
    [card.imageUri, computePos]
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
    <>
      <span
        role="img"
        aria-label={t("previewOf", { name: card.name })}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
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
    </>
  );
}


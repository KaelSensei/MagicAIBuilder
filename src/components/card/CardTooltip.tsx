"use client";
// Hover tooltip with card details — follows mouse cursor
import { useState, useCallback, useRef, cloneElement, isValidElement, Children } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useLocale } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";
import { useLocalizedDeckText } from "@/components/card/LocalizedDeckTextContext";
import { formatUsdPrice } from "@/i18n/number-format";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";

const TOOLTIP_WIDTH = 223;
const TOOLTIP_HEIGHT = 334; // image 310 + price row
const OFFSET_X = 16;

interface CardTooltipProps {
  readonly card: DeckCard;
  readonly children: React.ReactNode;
}

export function CardTooltip({ card, children }: CardTooltipProps) {
  const locale = useLocale();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  // The translated printing's own image when the deck surface has one —
  // a French viewer sees the French card, not English art with a caption.
  const localized = useLocalizedDeckText(card.name);
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
      const p = computePos(e);
      timerRef.current = setTimeout(() => setPos(p), 300);
    },
    [computePos]
  );

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPos(null);
  }, []);

  const child = Children.only(children);
  const trigger = isValidElement(child)
    ? cloneElement(child as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })
    : child;

  return (
    <>
      {trigger}
      {pos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-9999 overflow-hidden rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--lumen-shadow-lg)]"
            style={{ left: pos.x, top: pos.y, width: TOOLTIP_WIDTH, height: TOOLTIP_HEIGHT }}
          >
            <Image
              src={normalizeScryfallImageUrl(
                localized?.imageUri ?? card.imageUri
              )}
              alt={localized?.name ?? card.name}
              width={223}
              height={310}
              unoptimized
            />
            {card.price != null && (
              <div className="p-2 bg-(--surface) text-xs text-(--text-secondary)">
                <span className="text-(--accent)">
                  {formatUsdPrice(locale, card.price)}
                </span>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}

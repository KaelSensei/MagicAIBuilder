"use client";
// Hover tooltip with card details
import * as Tooltip from "@radix-ui/react-tooltip";
import Image from "next/image";
import type { DeckCard } from "@/lib/deck/types";

interface CardTooltipProps {
  card: DeckCard;
  children: React.ReactNode;
}

export function CardTooltip({ card, children }: CardTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-lg overflow-hidden shadow-2xl border border-[var(--border)]"
            side="right"
            sideOffset={12}
            align="center"
            avoidCollisions={true}
            collisionPadding={16}
          >
            <Image
              src={card.imageUri}
              alt={card.name}
              width={223}
              height={310}
              unoptimized
            />
            <div className="p-2 bg-[var(--surface)] text-xs text-[var(--text-secondary)] max-w-[223px]">
              {card.price != null && (
                <span className="text-[var(--accent)]">${card.price.toFixed(2)}</span>
              )}
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

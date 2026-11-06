"use client";
// Card image component with hover zoom and optional info overlay
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { cn } from "@/components/ui/utils";
import type { CardFace } from "@/lib/deck/types";
import { CardFlip } from "./CardFlip";
import { ManaCostDisplay } from "./ManaSymbol";

interface CardImageProps {
  readonly imageUri: string;
  readonly name: string;
  readonly largeUri?: string;
  readonly manaCost?: string;
  readonly cmc?: number;
  /** Show hover zoom effect */
  readonly zoomOnHover?: boolean;
  /** Show name/mana overlay on hover */
  readonly showOverlay?: boolean;
  readonly className?: string;
  readonly onClick?: () => void;
  /**
   * Both faces of a DFC/MDFC card.
   * When provided, renders a 3D flip card instead of a static image.
   */
  readonly cardFaces?: [CardFace, CardFace];
  readonly isFlexibleLand?: boolean;
}

/** Render mana cost as colored pip icons, with CMC fallback */
function ManaPips({ manaCost, cmc }: { readonly manaCost?: string; readonly cmc?: number }) {
  if (manaCost) {
    return <ManaCostDisplay manaCost={manaCost} className="bg-black/40 rounded px-1 py-0.5" />;
  }
  if (cmc != null) {
    return (
      <span className="text-[10px] font-mono text-white/80 bg-black/40 rounded px-1 py-0.5 leading-none">
        {cmc}
      </span>
    );
  }
  return null;
}

export function CardImage({
  imageUri,
  name,
  largeUri,
  manaCost,
  cmc,
  zoomOnHover = true,
  showOverlay = false,
  className,
  onClick,
  cardFaces,
  isFlexibleLand = false,
}: CardImageProps) {
  // Hooks must be called unconditionally — before any early returns
  const [isHovered, setIsHovered] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ readonly x: number; readonly y: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  /** Large printing used by the hover preview. Matches the Image width below. */
  const zoomWidth = 336;
  /** Large printing used by the hover preview. Matches the Image height below. */
  const zoomHeight = 468;

  React.useEffect(() => {
    if (!zoomOnHover) return;
    let timer: ReturnType<typeof setTimeout>;
    if (isHovered) {
      timer = setTimeout(() => setShowZoom(true), 300);
    } else {
      setShowZoom(false);
    }
    return () => clearTimeout(timer);
  }, [isHovered, zoomOnHover]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!showZoom || !anchor) {
      setZoomPos(null);
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const x = Math.min(rect.right + 8, globalThis.innerWidth - zoomWidth - 8);
    const y = Math.min(Math.max(rect.top, 8), globalThis.innerHeight - zoomHeight - 8);
    setZoomPos({ x, y });
  }, [showZoom, zoomHeight, zoomWidth]);

  if (cardFaces) {
    return (
      <CardFlip frontFace={cardFaces[0]} backFace={cardFaces[1]} isFlexibleLand={isFlexibleLand} className={className} onClick={onClick} />
    );
  }

  const src = imgError ? CARD_BACK_URL : imageUri;

  return (
    <div
      ref={anchorRef}
      role="img"
      aria-label={name}
      className={cn("relative inline-block w-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowZoom(false);
      }}
    >
      <motion.div
        className="card-image-wrapper cursor-pointer rounded-[4.75%] overflow-hidden w-full"
        transition={{ duration: 0.15 }}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
        aria-label={onClick ? `Add ${name} to deck` : undefined}
      >
        <Image
          src={src}
          alt={name}
          width={223}
          height={310}
          className="block w-full h-auto"
          onError={() => setImgError(true)}
          unoptimized
        />

        {/* Gradient overlay — slides up on hover */}
        {showOverlay && (
          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-b-[4.75%] pointer-events-none"
            initial={{ opacity: 0, y: 8 }}
            animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-6 pb-2 px-2">
              <p className="text-white text-[11px] font-semibold leading-tight truncate drop-shadow">
                {name}
              </p>
              {(manaCost || cmc != null) && (
                <div className="mt-0.5">
                  <ManaPips manaCost={manaCost} cmc={cmc} />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Add indicator */}
        {showOverlay && isHovered && onClick && (
          <motion.div
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.15 }}
          >
            <span className="text-white text-base font-bold leading-none">+</span>
          </motion.div>
        )}
      </motion.div>

      {/* Zoom panel */}
      {showZoom && zoomPos && largeUri && !showOverlay && createPortal(
        <div
          className="pointer-events-none fixed z-50 overflow-hidden rounded-[var(--lumen-radius-lg)] shadow-[var(--lumen-shadow-lg)]"
          style={{ left: zoomPos.x, top: zoomPos.y, width: zoomWidth, height: zoomHeight }}
        >
          <Image
            src={largeUri}
            alt={`${name} (large)`}
            width={zoomWidth}
            height={zoomHeight}
            unoptimized
          />
        </div>,
        document.body
      )}
    </div>
  );
}

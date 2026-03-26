"use client";
// Card image component with hover zoom and optional info overlay
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { cn } from "@/components/ui/utils";
import type { CardFace } from "@/lib/deck/types";
import { CardFlip } from "./CardFlip";

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
  readonly cardFaces?: [CardFace, CardFace];
  readonly isFlexibleLand?: boolean;
}

/** Render mana cost as colored pips — simplified text version */
function ManaPips({ manaCost, cmc }: { manaCost?: string; cmc?: number }) {
  if (!manaCost && cmc == null) return null;
  // Just show CMC as a number if no mana cost string
  const display = manaCost
    ? manaCost.replaceAll(/[{}]/g, "").replaceAll(/\//g, "")
    : String(cmc ?? "");
  return (
    <span className="text-[10px] font-mono text-white/80 bg-black/40 rounded px-1 py-0.5 leading-none">
      {display}
    </span>
  );
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
  const [isHovered, setIsHovered] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  if (cardFaces) {
    return (
      <CardFlip frontFace={cardFaces[0]} backFace={cardFaces[1]} isFlexibleLand={isFlexibleLand} className={className} onClick={onClick} />
    );
  }

  const src = imgError ? CARD_BACK_URL : imageUri;

  return (
    <div
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
        whileHover={zoomOnHover ? { scale: 1.03 } : undefined}
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
      <AnimatePresence>
        {showZoom && largeUri && !showOverlay && (
          <motion.div
            className="absolute z-50 left-full ml-2 top-0 rounded-lg overflow-hidden shadow-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <Image
              src={largeUri}
              alt={`${name} (large)`}
              width={336}
              height={468}
              unoptimized
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

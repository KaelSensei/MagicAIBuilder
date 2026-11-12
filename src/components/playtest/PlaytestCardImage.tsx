"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/components/ui/utils";
import {
  CARD_BACK_URL,
  normalizeScryfallImageUrl,
} from "@/lib/scryfall/images";

interface PlaytestCardImageProps {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
}

/**
 * Renders a playtest card in a stable card-shaped box with a bundled fallback.
 *
 * @param props - Image source, accessible label, and optional presentation classes.
 * @returns A card image that keeps its geometry when the requested source fails.
 */
export function PlaytestCardImage({
  src,
  alt,
  className,
}: PlaytestCardImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const requestedSrc = normalizeScryfallImageUrl(src) || CARD_BACK_URL;
  const visibleSrc = failedSrc === requestedSrc ? CARD_BACK_URL : requestedSrc;

  return (
    <Image
      src={visibleSrc}
      alt={alt}
      width={63}
      height={88}
      className={cn("aspect-[63/88] w-full object-cover", className)}
      onError={() => setFailedSrc(requestedSrc)}
      unoptimized
    />
  );
}

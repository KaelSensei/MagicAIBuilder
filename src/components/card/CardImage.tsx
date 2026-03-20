"use client";
// Card image component with hover zoom using Framer Motion
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { cn } from "@/components/ui/utils";

interface CardImageProps {
  imageUri: string;
  name: string;
  largeUri?: string;
  /** Show hover zoom effect */
  zoomOnHover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function CardImage({
  imageUri,
  name,
  largeUri,
  zoomOnHover = true,
  className,
  onClick,
}: CardImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Trigger zoom after 300ms hover
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

  const src = imgError ? CARD_BACK_URL : imageUri;

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowZoom(false);
      }}
    >
      <motion.div
        className="card-image-wrapper cursor-pointer rounded-[4.75%] overflow-hidden"
        whileHover={zoomOnHover ? { scale: 1.05 } : undefined}
        transition={{ duration: 0.15 }}
        onClick={onClick}
      >
        <Image
          src={src}
          alt={name}
          width={223}
          height={310}
          className="block"
          onError={() => setImgError(true)}
          unoptimized
        />
      </motion.div>

      {/* Zoom panel */}
      <AnimatePresence>
        {showZoom && largeUri && (
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

"use client";
// Fullscreen playtest modal — hand display, mulligan, draw, next turn
import { useCallback, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, ChevronRight, BookOpen, Layers } from "lucide-react";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { usePlaytest } from "@/hooks/usePlaytest";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { cn } from "@/components/ui/utils";

interface PlaytestModalProps {
  deck: Deck;
  onClose: () => void;
}

// Single card in the hand "fan"
function HandCard({
  card,
  index,
  total,
  isHovered,
  onHover,
  onLeave,
}: {
  card: DeckCard;
  index: number;
  total: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  // Spread cards in a fan: rotate from -30° to +30°
  const maxAngle = Math.min(30, total * 4);
  const angle = total <= 1 ? 0 : -maxAngle + (index / (total - 1)) * maxAngle * 2;
  const translateY = Math.abs(angle) * 0.5;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${(index / Math.max(total - 1, 1)) * 70 + 15}%`,
        transformOrigin: "bottom center",
        zIndex: isHovered ? 50 : index,
      }}
      animate={{
        rotate: isHovered ? 0 : angle,
        y: isHovered ? -40 : translateY,
        scale: isHovered ? 1.2 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="relative w-[80px] cursor-pointer drop-shadow-xl">
        <Image
          src={card.imageUri || CARD_BACK_URL}
          alt={card.name}
          width={80}
          height={112}
          className="rounded-lg w-[80px] h-[112px] object-cover"
          unoptimized
        />
        {isHovered && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-50"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Image
              src={card.imageUri || CARD_BACK_URL}
              alt={card.name}
              width={200}
              height={280}
              className="rounded-xl shadow-2xl w-[200px] h-[280px] object-cover border border-white/10"
              unoptimized
            />
            <p className="text-center text-xs text-white mt-1 bg-black/70 rounded px-2 py-0.5 truncate max-w-[200px]">
              {card.name}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Library top-card preview (face-down)
function LibraryPile({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[60px] h-[84px]">
        {[2, 1, 0].map((offset) => (
          <div
            key={offset}
            className="absolute rounded-md border border-white/10"
            style={{
              width: 60,
              height: 84,
              top: offset * 2,
              left: offset * 2,
              backgroundImage: `url(${CARD_BACK_URL})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 1 - offset * 0.15,
              zIndex: 3 - offset,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-white/60">{count} cards</span>
    </div>
  );
}

export function PlaytestModal({ deck, onClose }: PlaytestModalProps) {
  const { state, startPlaytest, mulligan, drawCard, nextTurn, stopPlaytest } =
    usePlaytest();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  const handleStart = useCallback(() => {
    startPlaytest(deck);
    setStarted(true);
  }, [deck, startPlaytest]);

  const handleMulligan = useCallback(() => {
    if (state) mulligan(state, deck);
  }, [state, deck, mulligan]);

  const handleDraw = useCallback(() => {
    if (state) drawCard(state);
  }, [state, drawCard]);

  const handleNextTurn = useCallback(() => {
    if (state) nextTurn(state);
  }, [state, nextTurn]);

  const handleClose = useCallback(() => {
    stopPlaytest();
    onClose();
  }, [stopPlaytest, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-semibold">
              Playtest — {deck.name}
            </h2>
            {state && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                Turn {state.turn}
                {state.mulliganCount > 0 && ` · ${state.mulliganCount} mulligan${state.mulliganCount > 1 ? "s" : ""}`}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-white/50 hover:text-white transition-colors p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
          {!started ? (
            /* Start screen */
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-white/70 text-sm mb-1">Ready to test your deck?</p>
                <p className="text-white/40 text-xs">
                  Shuffle and draw your opening hand of 7 cards.
                </p>
              </div>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors text-sm shadow-lg shadow-purple-900/50"
              >
                Draw Opening Hand
              </button>
            </div>
          ) : state ? (
            <>
              {/* Stats bar */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <BookOpen className="w-4 h-4" />
                  <span>{state.hand.length} in hand</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2 text-white/60">
                  <Layers className="w-4 h-4" />
                  <span>{state.library.length} in library</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="text-purple-300 text-xs">
                  {state.library.length === 0 ? "⚠️ Empty library" : ""}
                </div>
              </div>

              {/* Hand + library */}
              <div className="flex items-end justify-center gap-12 w-full max-w-5xl">
                {/* Hand fan */}
                <div className="flex-1 relative h-[200px] flex items-end justify-center">
                  {state.hand.length === 0 ? (
                    <p className="text-white/30 text-sm">No cards in hand</p>
                  ) : (
                    state.hand.map((card, i) => (
                      <HandCard
                        key={`${card.id}-${i}`}
                        card={card}
                        index={i}
                        total={state.hand.length}
                        isHovered={hoveredIndex === i}
                        onHover={() => setHoveredIndex(i)}
                        onLeave={() => setHoveredIndex(null)}
                      />
                    ))
                  )}
                </div>

                {/* Library pile */}
                <LibraryPile count={state.library.length} />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleMulligan}
                  disabled={state.mulliganCount >= 6}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    state.mulliganCount >= 6
                      ? "border-white/10 text-white/30 cursor-not-allowed"
                      : "border-white/20 text-white/70 hover:border-purple-500 hover:text-white hover:bg-purple-500/10"
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Mulligan
                  {state.mulliganCount > 0 && (
                    <span className="text-xs opacity-60">
                      (draw {Math.max(0, 7 - state.mulliganCount - 1)})
                    </span>
                  )}
                </button>

                <button
                  onClick={handleDraw}
                  disabled={state.library.length === 0}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                    state.library.length === 0
                      ? "border-white/10 text-white/30 cursor-not-allowed"
                      : "border-white/20 text-white/70 hover:border-blue-500 hover:text-white hover:bg-blue-500/10"
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Draw Card
                </button>

                <button
                  onClick={handleNextTurn}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shadow-lg shadow-purple-900/30"
                >
                  End Turn
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-6 bg-white/10" />

                <button
                  onClick={handleStart}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Restart
                </button>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

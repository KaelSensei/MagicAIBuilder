"use client";
// Fullscreen playtest — phases, life, and the hand / battlefield / graveyard zones
import { useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Deck } from "@/lib/deck/types";
import type { CardZone } from "@/lib/playtest/engine";
import { MAX_MULLIGANS, OPENING_HAND_SIZE } from "@/lib/playtest/engine";
import { usePlaytestStore } from "@/lib/playtest/store";
import { PhaseTracker } from "@/components/playtest/PhaseTracker";
import { LifeTracker } from "@/components/playtest/LifeTracker";
import { HandZone } from "@/components/playtest/HandZone";
import { BattlefieldZone } from "@/components/playtest/BattlefieldZone";
import { GraveyardZone } from "@/components/playtest/GraveyardZone";
import { RecordResultBar } from "@/components/playtest/RecordResultBar";
import { PlaytestHistoryPanel } from "@/components/playtest/PlaytestHistoryPanel";
import { OpeningHandEvidence } from "@/components/playtest/OpeningHandEvidence";
import { LocalizedDeckTextProvider } from "@/components/card/LocalizedDeckTextContext";

interface PlaytestModalProps {
  readonly deck: Deck;
  readonly onClose: () => void;
}

function PlaytestStartScreen({
  deckId,
  onStart,
}: {
  readonly deckId: string;
  readonly onStart: () => void;
}) {
  const t = useTranslations("playtest");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-white/70 text-sm mb-1">{t("start.prompt")}</p>
        <p className="text-white/40 text-xs">{t("start.hint")}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors text-sm shadow-lg shadow-purple-900/50"
      >
        {t("start.action")}
      </button>
      {/* Past runs, so the deck's record is in front of you before the next one */}
      <PlaytestHistoryPanel deckId={deckId} />
    </div>
  );
}

export function PlaytestModal({ deck, onClose }: PlaytestModalProps) {
  const t = useTranslations("playtest");

  // Fine-grained selectors: the modal re-renders on engine changes only.
  const engine = usePlaytestStore((s) => s.engine);
  const startPlaytest = usePlaytestStore((s) => s.startPlaytest);
  const stopPlaytest = usePlaytestStore((s) => s.stopPlaytest);
  const resetPlaytest = usePlaytestStore((s) => s.resetPlaytest);
  const mulligan = usePlaytestStore((s) => s.mulligan);
  const drawCard = usePlaytestStore((s) => s.drawCard);
  const nextPhase = usePlaytestStore((s) => s.nextPhase);
  const nextTurn = usePlaytestStore((s) => s.nextTurn);
  const damage = usePlaytestStore((s) => s.damage);
  const heal = usePlaytestStore((s) => s.heal);
  const tap = usePlaytestStore((s) => s.tap);
  const moveToZone = usePlaytestStore((s) => s.moveToZone);
  const addCounter = usePlaytestStore((s) => s.addCounter);
  const undo = usePlaytestStore((s) => s.undo);

  // The store outlives the modal, so a stale session would otherwise reappear
  // the next time it opens.
  useEffect(() => stopPlaytest, [stopPlaytest]);

  const handleClose = useCallback(() => {
    stopPlaytest();
    onClose();
  }, [stopPlaytest, onClose]);

  const handleStart = useCallback(() => startPlaytest(deck), [deck, startPlaytest]);

  const handleMoveFromHand = useCallback(
    (cardId: string, to: "battlefield" | "graveyard") =>
      moveToZone(cardId, "hand", to),
    [moveToZone]
  );

  const handleRemoveFromBattlefield = useCallback(
    (cardId: string) => moveToZone(cardId, "battlefield", "graveyard"),
    [moveToZone]
  );

  const handleRestore = useCallback(
    (cardId: string, from: CardZone, to: CardZone) => moveToZone(cardId, from, to),
    [moveToZone]
  );

  // Mulliganing is only meaningful before the game is under way; once a turn has
  // passed or permanents exist, the opening hand is no longer in question.
  const canMulligan =
    engine !== null &&
    engine.mulliganCount < MAX_MULLIGANS &&
    engine.turn === 1 &&
    engine.battlefield.length === 0 &&
    engine.graveyard.length === 0 &&
    engine.exile.length === 0;

  // Every card the zones can show — main deck plus the command zone
  const cardNames = useMemo(
    () =>
      [deck.commander, deck.partner, ...deck.cards]
        .filter((c) => c !== null && c !== undefined)
        .map((c) => c.name),
    [deck.commander, deck.partner, deck.cards]
  );

  return (
    <LocalizedDeckTextProvider names={cardNames}>
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Layers className="w-5 h-5 text-purple-400 shrink-0" aria-hidden="true" />
            <h2 className="text-white font-semibold truncate">
              {t("title")} — {deck.name}
            </h2>
            {engine && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 whitespace-nowrap">
                {t("turn", { turn: engine.turn })}
                {engine.mulliganCount > 0 &&
                  ` · ${t("mulliganCount", { count: engine.mulliganCount })}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {engine && (
              <RecordResultBar
                deckId={deck.id}
                turns={engine.turn}
                mulliganCount={engine.mulliganCount}
                onRecorded={handleClose}
              />
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("close")}
              className="text-white/50 hover:text-white transition-colors p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {engine === null ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <PlaytestStartScreen deckId={deck.id} onStart={handleStart} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto max-w-7xl grid gap-4 lg:grid-cols-[20rem_1fr]">
              {/* Left rail: turn structure and life */}
              <aside className="space-y-4">
                {canMulligan && <OpeningHandEvidence hand={engine.hand} />}
                <PhaseTracker
                  turn={engine.turn}
                  phase={engine.phase}
                  onNextPhase={nextPhase}
                  onNextTurn={nextTurn}
                />
                <LifeTracker
                  lifeTotal={engine.lifeTotal}
                  lifeHistory={engine.lifeHistory}
                  onDamage={damage}
                  onHeal={heal}
                  onUndo={undo}
                />
              </aside>

              {/* Board */}
              <div className="space-y-4">
                <BattlefieldZone
                  battlefield={engine.battlefield}
                  onTap={tap}
                  onAddCounter={addCounter}
                  onRemove={handleRemoveFromBattlefield}
                />
                <HandZone
                  hand={engine.hand}
                  libraryCount={engine.library.length}
                  onDrawCard={drawCard}
                  onMoveCard={handleMoveFromHand}
                />
                <GraveyardZone
                  graveyard={engine.graveyard}
                  exile={engine.exile}
                  onRestore={handleRestore}
                />

                {/* Session controls */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={mulligan}
                    disabled={!canMulligan}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-sm font-medium text-white/70 transition-all hover:border-purple-500 hover:text-white hover:bg-purple-500/10 disabled:border-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    {t("mulligan")}
                    {canMulligan && (
                      <span className="text-xs opacity-60">
                        {t("mulliganDown", {
                          count: OPENING_HAND_SIZE - engine.mulliganCount - 1,
                        })}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetPlaytest}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    {t("restart")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
    </LocalizedDeckTextProvider>
  );
}

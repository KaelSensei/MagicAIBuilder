"use client";
// Fullscreen playtest — phases, life, and the hand / battlefield / graveyard zones
import { useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Deck } from "@/lib/deck/types";
import type { CardZone } from "@/lib/playtest/engine";
import {
  isChoosingBottom,
  maxMulligans,
  mulliganBottomCount,
} from "@/lib/playtest/engine";
import { usePlaytestStore } from "@/lib/playtest/store";
import { PhaseTracker } from "@/components/playtest/PhaseTracker";
import { LifeTracker } from "@/components/playtest/LifeTracker";
import { HandZone } from "@/components/playtest/HandZone";
import { BattlefieldZone } from "@/components/playtest/BattlefieldZone";
import { GraveyardZone } from "@/components/playtest/GraveyardZone";
import { RecordResultBar } from "@/components/playtest/RecordResultBar";
import { PlaytestHistoryPanel } from "@/components/playtest/PlaytestHistoryPanel";
import { DrawProgressEvidence } from "@/components/playtest/DrawProgressEvidence";
import { OpeningHandEvidence } from "@/components/playtest/OpeningHandEvidence";
import { DiceRoller } from "@/components/playtest/DiceRoller";
import { PlaytestActionLog } from "@/components/playtest/PlaytestActionLog";
import { LocalizedDeckTextProvider } from "@/components/card/LocalizedDeckTextContext";
import { analyzeEngineDrawProgress } from "@/lib/playtest/draw-progress-evidence";
import { buildTokenLibrary } from "@/lib/deck/token-library";
import { hasComputedKeepRules } from "@/lib/playtest/keep-rules";

interface PlaytestModalProps {
  readonly deck: Deck;
  readonly onClose: () => void;
}

/** Fieldset reset: groups board controls so a pending choice can disable them at once. */
const BOARD_GROUP_CLASS = "m-0 min-w-0 space-y-4 border-0 p-0";

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
        <p className="text-[var(--text-secondary)] text-sm mb-1">{t("start.prompt")}</p>
        <p className="text-[var(--text-secondary)] text-xs">{t("start.hint")}</p>
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
  const bottomCards = usePlaytestStore((s) => s.bottomCards);
  const drawCard = usePlaytestStore((s) => s.drawCard);
  const nextPhase = usePlaytestStore((s) => s.nextPhase);
  const nextTurn = usePlaytestStore((s) => s.nextTurn);
  const damage = usePlaytestStore((s) => s.damage);
  const heal = usePlaytestStore((s) => s.heal);
  const tap = usePlaytestStore((s) => s.tap);
  const moveToZone = usePlaytestStore((s) => s.moveToZone);
  const addCounter = usePlaytestStore((s) => s.addCounter);
  const createCardCopy = usePlaytestStore((s) => s.createCardCopy);
  const createToken = usePlaytestStore((s) => s.createToken);
  const rollDie = usePlaytestStore((s) => s.rollDie);
  const addLogEntry = usePlaytestStore((s) => s.addLogEntry);
  const recordMana = usePlaytestStore((s) => s.recordMana);
  const editLogEntry = usePlaytestStore((s) => s.editLogEntry);
  const removeLogEntry = usePlaytestStore((s) => s.removeLogEntry);
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

  // A counted mulligan is not finished until the player bottoms its cards
  // (CR 103.5); until then the rest of the board is disabled.
  const choosingBottom = engine !== null && isChoosingBottom(engine);

  // Mulliganing is only meaningful before the game is under way; once a turn has
  // passed or permanents exist, the opening hand is no longer in question.
  const canMulligan =
    engine !== null &&
    !choosingBottom &&
    engine.mulliganCount < maxMulligans(engine) &&
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

  const drawEvidence = useMemo(
    () => (engine === null ? null : analyzeEngineDrawProgress(engine)),
    [engine]
  );

  // The guide's keep rules model Commander decks only; other formats keep the
  // land-balance hint.
  const keepRules = useMemo(
    () =>
      engine !== null && hasComputedKeepRules(deck.format)
        ? { mulligan: engine, bracket: deck.targetBracket }
        : undefined,
    [engine, deck.format, deck.targetBracket]
  );

  const requiredTokens = useMemo(
    () => buildTokenLibrary([deck.commander, deck.partner, ...deck.cards].filter((card) => card !== null)),
    [deck.commander, deck.partner, deck.cards]
  );

  return (
    <LocalizedDeckTextProvider names={cardNames}>
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="playtest-title"
        className="fixed inset-0 z-50 flex flex-col bg-[var(--background)] text-[var(--text-primary)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div
          data-testid="playtest-header"
          className="flex shrink-0 flex-col gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Layers className="w-5 h-5 text-purple-400 shrink-0" aria-hidden="true" />
            <h2 id="playtest-title" className="truncate font-semibold text-[var(--text-primary)]">
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
          <div className="flex min-w-0 items-start gap-3 lg:items-center">
            {engine && (
              <RecordResultBar
                deckId={deck.id}
                turns={engine.turn}
                mulliganCount={engine.mulliganCount}
                cardsSeen={drawEvidence?.cardsSeen ?? 0}
                additionalCardsSeen={drawEvidence?.additionalCardsSeen ?? 0}
                onRecorded={handleClose}
              />
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label={t("close")}
              className="shrink-0 rounded p-1 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
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
              <aside>
                <fieldset disabled={choosingBottom} className={BOARD_GROUP_CLASS}>
                  {engine.turn > 1 && <DrawProgressEvidence engine={engine} />}
                  {(canMulligan || (keepRules !== undefined && choosingBottom)) && (
                    <OpeningHandEvidence hand={engine.hand} keepRules={keepRules} />
                  )}
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
                </fieldset>
              </aside>

              {/* Board */}
              <div className="space-y-4">
                <fieldset disabled={choosingBottom} className={BOARD_GROUP_CLASS}>
                  <DiceRoller rolls={engine.diceRolls} onRoll={rollDie} />
                  <BattlefieldZone
                    battlefield={engine.battlefield}
                    onTap={tap}
                    onAddCounter={addCounter}
                    onCreateCopy={createCardCopy}
                    requiredTokens={requiredTokens}
                    onCreateToken={createToken}
                    onRemove={handleRemoveFromBattlefield}
                  />
                </fieldset>
                <HandZone
                  hand={engine.hand}
                  libraryCount={engine.library.length}
                  onDrawCard={drawCard}
                  onMoveCard={handleMoveFromHand}
                  bottomChoice={
                    choosingBottom
                      ? { count: engine.cardsToBottom, onConfirm: bottomCards, onUndo: undo }
                      : undefined
                  }
                />
                <fieldset disabled={choosingBottom} className={BOARD_GROUP_CLASS}>
                  <GraveyardZone
                    graveyard={engine.graveyard}
                    exile={engine.exile}
                    onRestore={handleRestore}
                  />
                  <PlaytestActionLog
                    deckName={deck.name}
                    entries={engine.actionLog}
                    onAdd={addLogEntry}
                    onRecordMana={recordMana}
                    onEdit={editLogEntry}
                    onRemove={removeLogEntry}
                  />
                </fieldset>

                {/* Session controls */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={mulligan}
                    disabled={!canMulligan}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] transition-all hover:border-purple-500 hover:text-[var(--text-primary)] hover:bg-purple-500/10 disabled:border-[var(--border)] disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    {t("mulligan")}
                    {canMulligan && (
                      <span className="text-xs opacity-60">
                        {t("mulliganHint", {
                          bottom: mulliganBottomCount({
                            mulliganCount: engine.mulliganCount + 1,
                            firstMulliganFree: engine.firstMulliganFree,
                          }),
                        })}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetPlaytest}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
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

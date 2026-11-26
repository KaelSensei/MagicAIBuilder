"use client";
// Deck Snapshots / History panel — save named versions of a deck. A failed
// load or save is told inline where the player is looking; a failed delete or
// restore in a toast. Each reads in the player's language (I-01).
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Camera,
  Clock,
  RotateCcw,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useSnapshotFailureMessage } from "@/hooks/useSnapshotFailureMessage";
import { useToastStore } from "@/hooks/useToast";
import {
  listSnapshots,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  type SnapshotMeta,
} from "@/lib/db/snapshot-api";
import { countDeckCards } from "@/lib/deck/deck-size";
import type { Deck } from "@/lib/deck/types";

interface SnapshotsPanelProps {
  readonly deckId: string;
  /**
   * The deck as the builder holds it now. Its cards are counted as the title bar counts them
   * (`countDeckCards`), the rule each snapshot's count follows, so an unchanged deck shows no
   * difference.
   */
  readonly currentDeck: Pick<Deck, "cards" | "commander" | "partner">;
  /** Called after a successful restore so the builder can reload the deck */
  readonly onRestore?: () => void;
}

/** What the open snapshot list shows. A failed load is not an empty history. */
type ListView = "loading" | "failed" | "empty" | "list";

/** Reads the list's state once, so the render does not repeat the conditions. */
function listViewOf(
  isLoading: boolean,
  loadError: string | null,
  snapshotCount: number
): ListView {
  if (isLoading) return "loading";
  if (loadError !== null) return "failed";
  return snapshotCount === 0 ? "empty" : "list";
}

function DiffBadge({
  snapshotCount,
  currentCount,
}: {
  readonly snapshotCount: number;
  readonly currentCount: number;
}) {
  const t = useTranslations("deck.snapshots");
  const diff = currentCount - snapshotCount;
  if (diff === 0) return null;
  const signed = diff > 0 ? `+${diff}` : String(diff);
  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded font-semibold",
        diff > 0
          ? "bg-green-500/15 text-green-400 border border-green-500/20"
          : "bg-red-500/15 text-red-400 border border-red-500/20"
      )}
    >
      {t("cardsDiff", { count: Math.abs(diff), signed })}
    </span>
  );
}

export function SnapshotsPanel({
  deckId,
  currentDeck,
  onRestore,
}: SnapshotsPanelProps) {
  const t = useTranslations("deck");
  const format = useFormatter();
  const describeFailure = useSnapshotFailureMessage();
  const addToast = useToastStore((s) => s.add);
  const currentCardCount = countDeckCards(currentDeck);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listView = listViewOf(isLoading, loadError, snapshots.length);
  const [isExpanded, setIsExpanded] = useState(false);

  // Save snapshot popover
  const [showSavePopover, setShowSavePopover] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Restore / delete confirmation
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await listSnapshots(deckId);
      setSnapshots(data);
    } catch (error) {
      setLoadError(describeFailure("load", error));
    } finally {
      setIsLoading(false);
    }
  }, [deckId, describeFailure]);

  // Load on expand
  useEffect(() => {
    if (isExpanded) void load();
  }, [isExpanded, load]);

  // Focus input when popover opens
  useEffect(() => {
    if (showSavePopover) {
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [showSavePopover]);

  const handleSave = async () => {
    const name = snapshotName.trim();
    if (!name) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await createSnapshot(deckId, name);
      setSnapshotName("");
      setShowSavePopover(false);
      if (isExpanded) await load();
    } catch (error) {
      setSaveError(describeFailure("save", error));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete and restore close their confirmation whatever the answer, so their
  // failure goes to a toast, which outlives the row's controls and is announced.
  const handleDelete = async (snapshotId: string) => {
    setIsActioning(true);
    try {
      await deleteSnapshot(deckId, snapshotId);
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    } catch (error) {
      addToast("error", describeFailure("delete", error));
    } finally {
      setIsActioning(false);
      setConfirmDelete(null);
    }
  };

  const handleRestore = async (snapshotId: string) => {
    setIsActioning(true);
    try {
      await restoreSnapshot(deckId, snapshotId);
      onRestore?.();
    } catch (error) {
      addToast("error", describeFailure("restore", error));
    } finally {
      setIsActioning(false);
      setConfirmRestore(null);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Clock className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
        <span className="text-xs font-semibold text-[var(--text-primary)] flex-1">
          {t("snapshots.title")}
        </span>

        {/* Save snapshot button / popover trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSavePopover((v) => !v);
              setSaveError(null);
            }}
            title={t("snapshots.saveSnapshot")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            {t("snapshots.save")}
          </button>

          {showSavePopover && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {t("snapshots.saveSnapshot")}
              </p>
              <input
                ref={nameInputRef}
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSave();
                  if (e.key === "Escape") setShowSavePopover(false);
                }}
                // The caption above names the action, not the field, and a
                // placeholder is no name (WCAG 2.2 SC 1.3.1 and 4.1.2).
                aria-label={t("snapshots.nameLabel")}
                placeholder={t("snapshots.placeholder")}
                maxLength={100}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              {saveError && (
                <p role="alert" className="text-[10px] text-red-400">
                  {saveError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!snapshotName.trim() || isSaving}
                  className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded bg-[var(--accent)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {isSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {t("snapshots.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavePopover(false)}
                  className="text-xs px-2 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t("snapshots.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expand/collapse: a disclosure button, so its name stays the same and aria-expanded
            carries the state (WAI-ARIA APG, https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/,
            read 2026-11-12). The list itself is mounted only while open, so no aria-controls. */}
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={t("snapshots.toggleList")}
          onClick={() => setIsExpanded((v) => !v)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expandable snapshot list */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] max-h-72 overflow-y-auto">
          {listView === "loading" && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
            </div>
          )}
          {listView === "failed" && (
            <div
              role="alert"
              className="flex flex-col items-center gap-2 py-6 text-xs text-red-400"
            >
              <p>{loadError}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {t("snapshots.retry")}
              </button>
            </div>
          )}
          {listView === "empty" && (
            <p className="text-xs text-[var(--text-secondary)] text-center py-6 italic">
              {t("snapshots.noSnapshots")}
            </p>
          )}
          {listView === "list" && (
            <ul className="divide-y divide-[var(--border)]">
              {snapshots.map((snap) => (
                <li
                  key={snap.id}
                  className="px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {snap.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {format.dateTime(new Date(snap.createdAt), {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-[10px] text-[var(--text-secondary)]"
                        >
                          ·
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {t("snapshots.cards", { count: snap.cardCount })}
                        </span>
                        {snap.commander && (
                          <span className="text-[10px] text-amber-400 truncate max-w-[100px]">
                            {snap.commander}
                          </span>
                        )}
                        <DiffBadge
                          snapshotCount={snap.cardCount}
                          currentCount={currentCardCount}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {confirmRestore === snap.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRestore(snap.id)}
                            disabled={isActioning}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                          >
                            {t("snapshots.confirm")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRestore(null)}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {t("snapshots.no")}
                          </button>
                        </>
                      )}
                      {confirmDelete === snap.id &&
                        confirmRestore !== snap.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDelete(snap.id)}
                              disabled={isActioning}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                              {t("snapshots.deleteConfirm")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              {t("snapshots.no")}
                            </button>
                          </>
                        )}
                      {confirmRestore !== snap.id &&
                        confirmDelete !== snap.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmRestore(snap.id)}
                              title={t("snapshots.restoreTooltip")}
                              className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-amber-400 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(snap.id)}
                              title={t("snapshots.deleteTooltip")}
                              className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

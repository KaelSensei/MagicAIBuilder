"use client";
// Deck Snapshots / History panel — save named versions of a deck
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Clock, RotateCcw, Trash2, Loader2, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/components/ui/utils";
import {
  listSnapshots,
  createSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  type SnapshotMeta,
} from "@/lib/db/snapshot-api";

interface SnapshotsPanelProps {
  readonly deckId: string;
  readonly currentCardCount: number;
  /** Called after a successful restore so the builder can reload the deck */
  readonly onRestore?: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function DiffBadge({ snapshotCount, currentCount }: { readonly snapshotCount: number; readonly currentCount: number }) {
  const diff = currentCount - snapshotCount;
  if (diff === 0) return null;
  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded font-semibold",
        diff > 0
          ? "bg-green-500/15 text-green-400 border border-green-500/20"
          : "bg-red-500/15 text-red-400 border border-red-500/20"
      )}
    >
      {diff > 0 ? `+${diff}` : diff} cards
    </span>
  );
}

export function SnapshotsPanel({ deckId, currentCardCount, onRestore }: SnapshotsPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      const data = await listSnapshots(deckId);
      setSnapshots(data);
    } catch {
      // silent — panel will show empty state
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  // Load on expand
  useEffect(() => {
    if (isExpanded) load();
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
      if (isExpanded) load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save snapshot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (snapshotId: string) => {
    setIsActioning(true);
    try {
      await deleteSnapshot(deckId, snapshotId);
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
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
        <span className="text-xs font-semibold text-[var(--text-primary)] flex-1">History</span>

        {/* Save snapshot button / popover trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSavePopover((v) => !v);
              setSaveError(null);
            }}
            title="Save snapshot"
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            Save
          </button>

          {showSavePopover && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-[var(--text-primary)]">Save snapshot</p>
              <input
                ref={nameInputRef}
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setShowSavePopover(false);
                }}
                placeholder='e.g. "v1 budget"'
                maxLength={100}
                className="w-full text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--accent)]"
              />
              {saveError && (
                <p className="text-[10px] text-red-400">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!snapshotName.trim() || isSaving}
                  className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded bg-[var(--accent)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Save
                </button>
                <button
                  onClick={() => setShowSavePopover(false)}
                  className="text-xs px-2 py-1.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expand/collapse */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable snapshot list */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] max-h-72 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
            </div>
          )}
          {!isLoading && snapshots.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)] text-center py-6 italic">
              No snapshots yet. Save one above!
            </p>
          )}
          {!isLoading && snapshots.length > 0 && (
            <ul className="divide-y divide-[var(--border)]">
              {snapshots.map((snap) => (
                <li key={snap.id} className="px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{snap.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {formatDate(snap.createdAt)} · {snap.cardCount} cards
                        </span>
                        {snap.commander && (
                          <span className="text-[10px] text-amber-400 truncate max-w-[100px]">
                            {snap.commander}
                          </span>
                        )}
                        <DiffBadge snapshotCount={snap.cardCount} currentCount={currentCardCount} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {confirmRestore === snap.id && (
                        <>
                          <button
                            onClick={() => handleRestore(snap.id)}
                            disabled={isActioning}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmRestore(null)}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            No
                          </button>
                        </>
                      )}
                      {confirmDelete === snap.id && confirmRestore !== snap.id && (
                        <>
                          <button
                            onClick={() => handleDelete(snap.id)}
                            disabled={isActioning}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          >
                            Delete?
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            No
                          </button>
                        </>
                      )}
                      {confirmRestore !== snap.id && confirmDelete !== snap.id && (
                        <>
                          <button
                            onClick={() => setConfirmRestore(snap.id)}
                            title="Restore to this snapshot"
                            className="p-1 rounded hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-amber-400 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(snap.id)}
                            title="Delete snapshot"
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

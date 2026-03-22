"use client";
// Keyboard shortcuts help modal — triggered by "?" or ⌨️ button
import { Keyboard } from "lucide-react";
import { useUIStore } from "@/lib/ui/store";
import { Modal } from "@/components/ui/Modal";

interface ShortcutEntry {
  readonly keys: readonly string[];
  readonly description: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: ["/"], description: "Focus search bar" },
  { keys: ["↑", "↓"], description: "Navigate search results" },
  { keys: ["Enter"], description: "Add first (or selected) result to deck" },
  { keys: ["Esc"], description: "Close modal / clear search" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["⌘Z", "Ctrl+Z"], description: "Undo last card add/remove" },
  { keys: ["⌘S", "Ctrl+S"], description: "Force save deck to database" },
  { keys: ["⌘E", "Ctrl+E"], description: "Open export modal" },
  { keys: ["⌘I", "Ctrl+I"], description: "Open import modal" },
];

interface KeybadgeProps {
  readonly label: string;
}

function Keybadge({ label }: KeybadgeProps) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-xs font-mono text-[var(--text-primary)] shadow-sm">
      {label}
    </kbd>
  );
}

export function KeyboardShortcutsModal() {
  const showKeyboardModal = useUIStore((s) => s.showKeyboardModal);
  const setShowKeyboardModal = useUIStore((s) => s.setShowKeyboardModal);

  return (
    <Modal
      open={showKeyboardModal}
      onClose={() => setShowKeyboardModal(false)}
      maxWidth="w-[460px] max-w-[90vw]"
      showClose={false}
    >
      {/* Header with icon */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
        <Keyboard className="w-4 h-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">
          Keyboard Shortcuts
        </h2>
        <button
          onClick={() => setShowKeyboardModal(false)}
          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Shortcuts table */}
      <div className="px-5 py-4 space-y-1">
        {SHORTCUTS.map((entry) => (
          <div
            key={entry.description}
            className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 last:border-0"
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {entry.description}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-4">
              {entry.keys.map((k, i) => (
                <span key={k} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-xs text-[var(--text-secondary)]">/</span>
                  )}
                  <Keybadge label={k} />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-5 pb-4">
        <p className="text-xs text-[var(--text-secondary)] text-center">
          Shortcuts are inactive when a text field is focused (except modifier shortcuts)
        </p>
      </div>
    </Modal>
  );
}

// Trigger button — renders a small ⌨ button suitable for footers / headers
export function KeyboardShortcutsTrigger() {
  const setShowKeyboardModal = useUIStore((s) => s.setShowKeyboardModal);
  return (
    <button
      onClick={() => setShowKeyboardModal(true)}
      title="Keyboard shortcuts (?)"
      className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
    >
      <Keyboard className="w-3.5 h-3.5" />
      <span>Shortcuts</span>
    </button>
  );
}

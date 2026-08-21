"use client";
// Keyboard shortcuts help modal — triggered by "?" or ⌨️ button
import { useTranslations } from "next-intl";
import { Keyboard } from "lucide-react";
import { useUIStore } from "@/lib/ui/store";
import { Modal } from "@/components/ui/Modal";

interface ShortcutEntry {
  readonly keys: readonly string[];
  /** Message key under `common.shortcuts`, resolved at render. */
  readonly descriptionKey: string;
}

/**
 * The chords are literal on purpose — `⌘Z` and `Esc` are the same on a French
 * keyboard — while the descriptions are keys, since those are prose.
 */
const SHORTCUTS: ShortcutEntry[] = [
  { keys: ["/"], descriptionKey: "focusSearch" },
  { keys: ["↑", "↓"], descriptionKey: "navigateResults" },
  { keys: ["Enter"], descriptionKey: "addResult" },
  { keys: ["Esc"], descriptionKey: "closeModal" },
  { keys: ["?"], descriptionKey: "showShortcuts" },
  { keys: ["⌘Z", "Ctrl+Z"], descriptionKey: "undo" },
  { keys: ["⌘S", "Ctrl+S"], descriptionKey: "save" },
  { keys: ["⌘E", "Ctrl+E"], descriptionKey: "export" },
  { keys: ["⌘I", "Ctrl+I"], descriptionKey: "import" },
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
  const t = useTranslations("common");
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
        <Keyboard className="w-4 h-4 text-[var(--accent-text)]" />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">
          {t("shortcuts.title")}
        </h2>
        <button
          type="button"
          onClick={() => setShowKeyboardModal(false)}
          className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          aria-label={t("actions.close")}
        >
          ✕
        </button>
      </div>

      {/* Shortcuts table */}
      <div className="px-5 py-4 space-y-1">
        {SHORTCUTS.map((entry) => (
          <div
            key={entry.descriptionKey}
            className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 last:border-0"
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {t(`shortcuts.${entry.descriptionKey}`)}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-4">
              {entry.keys.map((k, i) => (
                <span key={k} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      /
                    </span>
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
          {t("shortcuts.inactiveHint")}
        </p>
      </div>
    </Modal>
  );
}

// Trigger button — renders a small ⌨ button suitable for footers / headers
export function KeyboardShortcutsTrigger() {
  const t = useTranslations("common");
  const setShowKeyboardModal = useUIStore((s) => s.setShowKeyboardModal);
  return (
    <button
      type="button"
      onClick={() => setShowKeyboardModal(true)}
      title={t("shortcuts.open")}
      className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
    >
      <Keyboard className="w-3.5 h-3.5" />
      <span>{t("shortcuts.triggerLabel")}</span>
    </button>
  );
}

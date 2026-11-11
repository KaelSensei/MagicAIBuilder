"use client";
/**
 * The deck's free-form tags, as removable pills, with an inline input and a few suggestions.
 *
 * Context: deck building (ui). It saves through the deck store's `addTag` and
 * `removeTag`, which trim a tag to 50 characters, skip duplicates, save the whole
 * list with `PATCH /api/decks/[id]`, and restore the previous list on a failed save.
 *
 * @module deck/DeckTagsEditor
 */
import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useDeckStore } from "@/lib/deck/store";

const TAG_SUGGESTIONS = ["casual", "cEDH", "WIP", "budget", "tuned", "theme"];

const TAG_COLORS: Record<string, string> = {
  casual: "bg-green-500/20 text-green-400 border-green-500/30",
  cEDH: "bg-red-500/20 text-red-400 border-red-500/30",
  WIP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  budget: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tuned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  theme: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const DEFAULT_TAG_COLOR =
  "bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)]";

interface DeckTagsEditorProps {
  readonly deckId: string;
  readonly tags: readonly string[];
}

/**
 * Edits the tags of one deck.
 *
 * Enter adds the typed tag, Tab adds the first matching suggestion, Escape
 * closes the input. `tags` is the deck's saved list, read from the store by the
 * caller, so a failed save shows the restored list.
 */
export function DeckTagsEditor({ deckId, tags }: DeckTagsEditorProps) {
  const t = useTranslations("builder");
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Actions only: subscribing to the whole store re-rendered the editor on every
  // store change, such as each save's isSyncing toggle.
  const { addTag, removeTag } = useDeckStore(
    useShallow((state) => ({
      addTag: state.addTag,
      removeTag: state.removeTag,
    }))
  );

  const suggestions = TAG_SUGGESTIONS.filter(
    (s) =>
      !tags.includes(s) && s.toLowerCase().startsWith(inputValue.toLowerCase())
  );

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    void addTag(deckId, trimmed);
    setInputValue("");
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTag(inputValue);
    }
    if (e.key === "Escape") {
      setShowInput(false);
      setInputValue("");
    }
    if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      handleAddTag(suggestions[0]);
    }
  };

  const handleShowInput = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const tagColor = (tag: string) => TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR;

  return (
    <div className="px-3 py-2 border-b border-[var(--border)]">
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${tagColor(tag)}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(deckId, tag)}
              className="hover:opacity-70 transition-opacity"
              aria-label={t("actions.removeTag", { tag })}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        {showInput ? (
          <div className="relative">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!inputValue) {
                  setShowInput(false);
                }
              }}
              placeholder={t("tags.placeholder")}
              maxLength={50}
              className="bg-[var(--surface)] border border-[var(--accent)] rounded-full px-2 py-0.5 text-[10px] text-[var(--text-primary)] outline-none w-24"
            />
            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && inputValue.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--surface-elevated,var(--surface))] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[120px]">
                {suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onMouseDown={() => handleAddTag(s)}
                    className="w-full text-left px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleShowInput}
            className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-1.5 py-0.5 rounded-full border border-dashed border-[var(--border)] hover:border-[var(--accent)]"
          >
            <Plus className="w-2.5 h-2.5" />
            {tags.length === 0 ? t("tags.add") : ""}
          </button>
        )}

        {/* Suggestion pills when no input */}
        {!showInput && tags.length === 0 && (
          <div className="flex flex-wrap gap-1">
            {TAG_SUGGESTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => addTag(deckId, s)}
                className={`text-[10px] px-2 py-0.5 rounded-full border opacity-40 hover:opacity-80 transition-opacity ${tagColor(s)}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

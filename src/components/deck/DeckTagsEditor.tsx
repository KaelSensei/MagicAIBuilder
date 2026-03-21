"use client";
// Deck tags editor — pill tags with suggestions and add/remove
import { useState, useRef } from "react";
import { X, Plus } from "lucide-react";
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

const DEFAULT_TAG_COLOR = "bg-[var(--border)] text-[var(--text-secondary)] border-[var(--border)]";

interface DeckTagsEditorProps {
  deckId: string;
  tags: string[];
}

export function DeckTagsEditor({ deckId, tags }: DeckTagsEditorProps) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTag, removeTag } = useDeckStore();

  const suggestions = TAG_SUGGESTIONS.filter(
    (s) => !tags.includes(s) && s.toLowerCase().startsWith(inputValue.toLowerCase())
  );

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    addTag(deckId, trimmed);
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
              onClick={() => removeTag(deckId, tag)}
              className="hover:opacity-70 transition-opacity"
              aria-label={`Remove tag ${tag}`}
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
              placeholder="tag name…"
              maxLength={50}
              className="bg-[var(--surface)] border border-[var(--accent)] rounded-full px-2 py-0.5 text-[10px] text-[var(--text-primary)] outline-none w-24"
            />
            {/* Autocomplete suggestions */}
            {suggestions.length > 0 && inputValue.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--surface-elevated,var(--surface))] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[120px]">
                {suggestions.map((s) => (
                  <button
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
            onClick={handleShowInput}
            className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-1.5 py-0.5 rounded-full border border-dashed border-[var(--border)] hover:border-[var(--accent)]"
          >
            <Plus className="w-2.5 h-2.5" />
            {tags.length === 0 ? "Add tag" : ""}
          </button>
        )}

        {/* Suggestion pills when no input */}
        {!showInput && tags.length === 0 && (
          <div className="flex flex-wrap gap-1">
            {TAG_SUGGESTIONS.map((s) => (
              <button
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

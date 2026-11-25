"use client";
// Scryfall search input with debounce + keyboard shortcut hints
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Search, X, Loader2 } from "lucide-react";
import { fieldShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import { useUIStore } from "@/lib/ui/store";
import { useShortcutPreferencesStore } from "@/lib/ui/shortcut-preferences";

interface SearchBarProps {
  readonly onSearch: (query: string) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly placeholder?: string;
  /**
   * The field's accessible name. Defaults to the catalogue's `search.label`. A placeholder is
   * not a label (WCAG 2.2 SC 1.3.1, 4.1.2): it disappears on typing and is not a reliable name.
   */
  readonly label?: string;
  readonly isLoading?: boolean;
  readonly className?: string;
  readonly showKeyboardHint?: boolean;
}

/**
 * The builder's card search field. It reports the typed text through `onSearch` after a 400 ms
 * pause, answers the UI store's focus and clear signals, and is named by `label` (or the
 * catalogue default), never by its placeholder alone.
 */
export function SearchBar({
  onSearch,
  onFocus,
  onBlur,
  placeholder,
  label,
  isLoading = false,
  className,
  showKeyboardHint = true,
}: SearchBarProps) {
  const t = useTranslations("search");
  const resolvedPlaceholder = placeholder ?? t("placeholder");
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to focus / clear signals from UI store
  const searchFocusSignal = useUIStore((s) => s.searchFocusSignal);
  const searchClearSignal = useUIStore((s) => s.searchClearSignal);
  // The "/" hint advertises a single-key shortcut, so it goes when they are off.
  const singleKeyShortcutsEnabled = useShortcutPreferencesStore(
    (s) => s.singleKeyShortcutsEnabled
  );

  // Trigger focus when signal fires
  useEffect(() => {
    if (searchFocusSignal > 0) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: signal-based trigger; stable refs excluded
  }, [searchFocusSignal]);

  // Trigger clear when signal fires
  useEffect(() => {
    if (searchClearSignal > 0) {
      setValue("");
      onSearch("");
      inputRef.current?.blur();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: signal-based trigger; onSearch is stable
  }, [searchClearSignal]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(value);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onSearch]);

  const handleClear = () => {
    setValue("");
    onSearch("");
  };

  return (
    <div
      className={cn(
        fieldShellClassName,
        "relative flex items-center focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-soft)]",
        className
      )}
    >
      <span className="pl-3 text-[var(--text-secondary)]">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={resolvedPlaceholder}
        aria-label={label ?? t("label")}
        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none min-w-0"
        data-testid="search-input"
      />
      {/* Keyboard hint badge — hidden when typing */}
      {!value && showKeyboardHint && singleKeyShortcutsEnabled && (
        <span className="pr-2 text-[10px] text-[var(--text-secondary)]/60 font-mono shrink-0 select-none">
          ⌨ /
        </span>
      )}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="pr-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={t("clearLabel")}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

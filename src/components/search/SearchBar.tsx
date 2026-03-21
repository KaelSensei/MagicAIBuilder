"use client";
// Scryfall search input with debounce + keyboard shortcut hints
import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useUIStore } from "@/lib/ui/store";

interface SearchBarProps {
  readonly onSearch: (query: string) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly placeholder?: string;
  readonly isLoading?: boolean;
  readonly className?: string;
  readonly showKeyboardHint?: boolean;
}

export function SearchBar({
  onSearch,
  onFocus,
  onBlur,
  placeholder = "Search cards…",
  isLoading = false,
  className,
  showKeyboardHint = true,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to focus / clear signals from UI store
  const searchFocusSignal = useUIStore((s) => s.searchFocusSignal);
  const searchClearSignal = useUIStore((s) => s.searchClearSignal);

  // Trigger focus when signal fires
  useEffect(() => {
    if (searchFocusSignal > 0) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFocusSignal]);

  // Trigger clear when signal fires
  useEffect(() => {
    if (searchClearSignal > 0) {
      setValue("");
      onSearch("");
      inputRef.current?.blur();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        "relative flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent)] transition-colors",
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
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none min-w-0"
        data-testid="search-input"
      />
      {/* Keyboard hint badge — hidden when typing */}
      {!value && showKeyboardHint && (
        <span className="pr-2 text-[10px] text-[var(--text-secondary)]/60 font-mono shrink-0 select-none">
          ⌨ /
        </span>
      )}
      {value && (
        <button
          onClick={handleClear}
          className="pr-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

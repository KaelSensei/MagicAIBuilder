"use client";
// Set code autocomplete for "By Set" search mode
// Dynamically loads all sets from Scryfall API
import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SetOption {
  code: string;
  name: string;
  set_type: string;
  released_at?: string;
  card_count: number;
  icon_svg_uri?: string;
}

// Set types that are relevant for Commander deck building
const COMMANDER_SET_TYPES = new Set([
  "core",
  "expansion",
  "masters",
  "commander",
  "draft_innovation",
  "funny",
  "starter",
  "box",
  "promo",
  "memorabilia",
  "reprint",
  "masterpiece",
]);

// Cache the sets in memory to avoid re-fetching
let setsCache: SetOption[] | null = null;
let setsCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function fetchAllSets(): Promise<SetOption[]> {
  const now = Date.now();
  if (setsCache && now - setsCacheTime < CACHE_TTL) {
    return setsCache;
  }

  const res = await fetch("https://api.scryfall.com/sets");
  if (!res.ok) throw new Error("Failed to fetch sets");
  const data = await res.json();

  // Filter to sets that have cards and are relevant for Commander
  const sets: SetOption[] = (data.data as SetOption[])
    .filter(
      (s) =>
        s.card_count > 0 &&
        COMMANDER_SET_TYPES.has(s.set_type)
    )
    .sort((a, b) => {
      // Sort by release date descending (newest first)
      const dateA = a.released_at ?? "";
      const dateB = b.released_at ?? "";
      return dateB.localeCompare(dateA);
    });

  setsCache = sets;
  setsCacheTime = now;
  return sets;
}

interface SetAutocompleteProps {
  readonly value: string;
  readonly onChange: (code: string, name: string) => void;
  readonly onClear: () => void;
}

export function SetAutocomplete({ value, onChange, onClear }: SetAutocompleteProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [allSets, setAllSets] = useState<SetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Load sets on first open
  const loadSets = useCallback(async () => {
    if (allSets.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const sets = await fetchAllSets();
      setAllSets(sets);
    } catch {
      setError("Failed to load sets");
    } finally {
      setLoading(false);
    }
  }, [allSets.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered =
    input.length > 0
      ? allSets
          .filter(
            (s) =>
              s.name.toLowerCase().includes(input.toLowerCase()) ||
              s.code.toLowerCase().includes(input.toLowerCase())
          )
          .slice(0, 12)
      : allSets.slice(0, 12);

  const selectedSet = allSets.find((s) => s.code === value);

  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--accent)] bg-[var(--surface)]">
        <span className="text-xs font-mono text-[var(--accent)] uppercase">{value}</span>
        <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
          {selectedSet?.name ?? value}
        </span>
        <button
          onClick={onClear}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent)] transition-colors">
        <span className="pl-3 text-[var(--text-secondary)]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            loadSets();
          }}
          placeholder="Search set (e.g. dsk, mh3…)"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
        />
        {loading && (
          <span className="pr-3 text-[var(--text-secondary)]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </span>
        )}
      </div>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-20 overflow-hidden">
          {loading && (
            <div className="px-3 py-3 text-sm text-[var(--text-secondary)] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading sets…
            </div>
          )}
          {error && (
            <div className="px-3 py-3 text-sm text-red-400">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && input.length > 0 && (
            <div className="px-3 py-3 text-sm text-[var(--text-secondary)]">
              No sets found for &quot;{input}&quot;
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((s) => (
                <button
                  key={s.code}
                  onClick={() => {
                    onChange(s.code, s.name);
                    setInput("");
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-hover)] text-left transition-colors"
                >
                  <span className="text-xs font-mono text-[var(--accent)] uppercase w-10 shrink-0">
                    {s.code}
                  </span>
                  <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                    {s.name}
                  </span>
                  {s.released_at && (
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      {s.released_at.slice(0, 4)}
                    </span>
                  )}
                </button>
              ))}
              {input.length === 0 && allSets.length > 12 && (
                <div className="px-3 py-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)]">
                  {allSets.length} sets available — type to search
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

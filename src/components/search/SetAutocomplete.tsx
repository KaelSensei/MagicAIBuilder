"use client";
// Set code autocomplete for "By Set" search mode
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SetOption {
  code: string;
  name: string;
}

// A curated list of popular Commander-legal sets for quick access
// Scryfall doesn't have a simple "all sets" endpoint that's easy to parse, so we use a static list
// User can also type any set code directly
const POPULAR_SETS: SetOption[] = [
  { code: "dsk", name: "Duskmourn" },
  { code: "blb", name: "Bloomburrow" },
  { code: "mh3", name: "Modern Horizons 3" },
  { code: "otj", name: "Outlaws of Thunder Junction" },
  { code: "mkm", name: "Murders at Karlov Manor" },
  { code: "lci", name: "The Lost Caverns of Ixalan" },
  { code: "woe", name: "Wilds of Eldraine" },
  { code: "mom", name: "March of the Machine" },
  { code: "one", name: "Phyrexia: All Will Be One" },
  { code: "bro", name: "The Brothers' War" },
  { code: "dmr", name: "Dominaria Remastered" },
  { code: "snc", name: "Streets of New Capenna" },
  { code: "neo", name: "Kamigawa: Neon Dynasty" },
  { code: "vow", name: "Innistrad: Crimson Vow" },
  { code: "mid", name: "Innistrad: Midnight Hunt" },
  { code: "afr", name: "Adventures in the Forgotten Realms" },
  { code: "stx", name: "Strixhaven" },
  { code: "khm", name: "Kaldheim" },
  { code: "znr", name: "Zendikar Rising" },
  { code: "m21", name: "Core Set 2021" },
  { code: "iko", name: "Ikoria" },
  { code: "thb", name: "Theros Beyond Death" },
  { code: "eld", name: "Throne of Eldraine" },
  { code: "c21", name: "Commander 2021" },
  { code: "cmr", name: "Commander Legends" },
  { code: "cmd", name: "Commander 2011" },
  { code: "2x2", name: "Double Masters 2022" },
  { code: "clb", name: "Commander Legends: Battle for Baldur's Gate" },
  { code: "dmc", name: "Dominaria United Commander" },
  { code: "ncc", name: "New Capenna Commander" },
  { code: "nec", name: "Neon Dynasty Commander" },
  { code: "afc", name: "Forgotten Realms Commander" },
  { code: "moc", name: "March of the Machine Commander" },
  { code: "woc", name: "Wilds of Eldraine Commander" },
  { code: "otc", name: "Thunder Junction Commander" },
  { code: "blc", name: "Bloomburrow Commander" },
];

interface SetAutocompleteProps {
  value: string;
  onChange: (code: string, name: string) => void;
  onClear: () => void;
}

export function SetAutocomplete({ value, onChange, onClear }: SetAutocompleteProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered =
    input.length > 0
      ? POPULAR_SETS.filter(
          (s) =>
            s.name.toLowerCase().includes(input.toLowerCase()) ||
            s.code.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 8)
      : POPULAR_SETS.slice(0, 8);

  const selectedSet = POPULAR_SETS.find((s) => s.code === value);

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
          onFocus={() => setOpen(true)}
          placeholder="Search set (e.g. dsk, mh3…)"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-20 overflow-hidden">
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
              <span className="text-sm text-[var(--text-primary)] truncate">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
// Advanced search filters — color (OR/AND/EXACT), lands, colorless, CMC modes,
// price range, subtype, keyword, power/toughness, interaction type, presets
import { useCallback, useState } from "react";
import { cn } from "@/components/ui/utils";
import type {
  CmcMode,
  ColorMode,
  InteractionType,
  SearchFilters,
} from "@/lib/deck/types";
import { useCollectionStore } from "@/lib/collection/store";

const WUBRG_COLORS = [
  { code: "W", label: "White" },
  { code: "U", label: "Blue" },
  { code: "B", label: "Black" },
  { code: "R", label: "Red" },
  { code: "G", label: "Green" },
] as const;

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string; title: string }[] = [
  { value: "or",    label: "Any",   title: "Cards that include at least one of the selected colors (id<=…)" },
  { value: "and",   label: "All",   title: "Cards that include ALL selected colors (c>=…)" },
  { value: "exact", label: "Exact", title: "Cards that are exactly these colors, no more (c=…)" },
];

const CMC_MODES: { value: CmcMode; label: string }[] = [
  { value: "range", label: "Range" },
  { value: "exact", label: "Exact" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
];

const INTERACTION_OPTIONS: { value: InteractionType | ""; label: string }[] = [
  { value: "",             label: "None" },
  { value: "removal",      label: "Removal" },
  { value: "counterspell", label: "Counterspell" },
  { value: "wipe",         label: "Board Wipe" },
  { value: "tutor",        label: "Tutor" },
  { value: "draw",         label: "Draw" },
  { value: "ramp",         label: "Ramp" },
];

/** localStorage key for saved filter presets */
const PRESETS_STORAGE_KEY = "magicaibuilder:filter-presets";

interface FilterPreset {
  name: string;
  filters: SearchFilters;
}

function loadPresets(): FilterPreset[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FilterPreset[]) : [];
  } catch {
    return [];
  }
}

function persistPresets(presets: FilterPreset[]): void {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

const inputCls =
  "text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1 " +
  "text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";

function TabButton({
  active, onClick, title, children,
}: {
  readonly active: boolean; readonly onClick: () => void; readonly title?: string; readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 text-xs rounded transition-colors",
        active
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
}
TabButton.displayName = "TabButton";

function NumInput({
  value, onChange, placeholder, min = 0, max, className,
}: {
  readonly value: number | null; readonly onChange: (v: number | null) => void;
  readonly placeholder: string; readonly min?: number; readonly max?: number; readonly className?: string;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={cn(inputCls, className)}
    />
  );
}
NumInput.displayName = "NumInput";

interface SearchFiltersProps {
  readonly filters: SearchFilters;
  readonly onChange: (filters: SearchFilters) => void;
  readonly className?: string;
}

export function SearchFilters({ filters, onChange, className }: SearchFiltersProps) {
  const collectionSize = useCollectionStore(
    (s) => Object.keys(s.collectionCards).length + Object.keys(s.collectionCardsFoil).length
  );

  const [presets, setPresets] = useState<FilterPreset[]>(loadPresets);
  const [presetName, setPresetName] = useState("");

  const showPowerToughness = filters.types.some((t) => t.toLowerCase() === "creature");

  const toggleColor = (code: string) => {
    const next = filters.colors.includes(code)
      ? filters.colors.filter((c) => c !== code)
      : [...filters.colors, code];
    onChange({ ...filters, colors: next, colorlessFilter: false });
  };

  const toggleColorless = () => {
    const next = !filters.colorlessFilter;
    onChange({ ...filters, colorlessFilter: next, colors: next ? [] : filters.colors });
  };

  const toggleLands = () => onChange({ ...filters, landFilter: !filters.landFilter });

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim();
    if (!name) return;
    const updated: FilterPreset[] = [
      ...presets.filter((p) => p.name !== name),
      { name, filters },
    ];
    setPresets(updated);
    persistPresets(updated);
    setPresetName("");
  }, [presetName, presets, filters]);

  const handleLoadPreset = useCallback(
    (name: string) => {
      const found = presets.find((p) => p.name === name);
      if (found) onChange(found.filters);
    },
    [presets, onChange]
  );

  return (
    <div className={cn("space-y-3 p-3", className)}>
      {/* ── Colors ── */}
      <div>
        <p className="text-xs text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Colors</p>
        <div className="flex gap-1.5 items-center flex-wrap">
          {WUBRG_COLORS.map((c) => (
            <button
              key={c.code} type="button" title={c.label}
              onClick={() => toggleColor(c.code)}
              className={cn(
                "w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center",
                filters.colors.includes(c.code)
                  ? "border-[var(--accent)] scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://svgs.scryfall.io/card-symbols/${c.code}.svg`} alt={c.label} width={22} height={22} className="w-[22px] h-[22px]" />
            </button>
          ))}

          {/* Colorless (c:c) — truly colorless, mutually exclusive with WUBRG */}
          <button
            type="button" title="Colorless (c:c) — artifacts, Eldrazi, etc."
            onClick={toggleColorless}
            className={cn(
              "w-8 h-8 rounded-full transition-all border-2 flex items-center justify-center",
              filters.colorlessFilter ? "border-[var(--accent)] scale-110" : "border-transparent opacity-60 hover:opacity-100"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://svgs.scryfall.io/card-symbols/C.svg" alt="Colorless" width={22} height={22} className="w-[22px] h-[22px]" />
          </button>

          {/* Lands toggle — t:land, composable with color filter */}
          <button
            type="button" title="Lands (t:land)"
            onClick={toggleLands}
            className={cn(
              "px-2 h-8 rounded transition-all border-2 text-xs font-medium",
              filters.landFilter
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)] opacity-70 hover:opacity-100"
            )}
          >
            🏔 Land
          </button>
        </div>

        {/*
         * AND / OR / EXACT color-mode toggle.
         * Only shown when 2+ colors selected — single-color has no meaningful distinction.
         */}
        {filters.colors.length >= 2 && (
          <div className="mt-2 flex gap-1 items-center">
            <span className="text-xs text-[var(--text-secondary)] mr-1">Match:</span>
            {COLOR_MODE_OPTIONS.map((opt) => (
              <TabButton
                key={opt.value}
                active={filters.colorMode === opt.value}
                title={opt.title}
                onClick={() => onChange({ ...filters, colorMode: opt.value })}
              >
                {opt.label}
              </TabButton>
            ))}
          </div>
        )}
      </div>

      {/* ── CMC ── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">CMC</p>
          <div className="flex gap-0.5">
            {CMC_MODES.map((m) => (
              <TabButton
                key={m.value}
                active={filters.cmcMode === m.value}
                onClick={() => onChange({ ...filters, cmcMode: m.value, cmcMin: null, cmcMax: null, cmcExact: null })}
              >
                {m.label}
              </TabButton>
            ))}
          </div>
        </div>
        {filters.cmcMode === "exact" && (
          <NumInput value={filters.cmcExact} onChange={(v) => onChange({ ...filters, cmcExact: v })} placeholder="e.g. 3" max={20} className="w-20" />
        )}
        {filters.cmcMode === "min" && (
          <NumInput value={filters.cmcMin} onChange={(v) => onChange({ ...filters, cmcMin: v })} placeholder="≥" max={20} className="w-20" />
        )}
        {filters.cmcMode === "max" && (
          <NumInput value={filters.cmcMax} onChange={(v) => onChange({ ...filters, cmcMax: v })} placeholder="≤" max={20} className="w-20" />
        )}
        {filters.cmcMode === "range" && (
          <div className="flex gap-2 items-center">
            <NumInput value={filters.cmcMin} onChange={(v) => onChange({ ...filters, cmcMin: v })} placeholder="Min" max={20} className="w-16" />
            <span className="text-[var(--text-secondary)] text-xs">—</span>
            <NumInput value={filters.cmcMax} onChange={(v) => onChange({ ...filters, cmcMax: v })} placeholder="Max" max={20} className="w-16" />
          </div>
        )}
      </div>

      {/* ── Price ── */}
      <div className="flex gap-2 items-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10 shrink-0">Price</p>
        <NumInput value={filters.priceMin} onChange={(v) => onChange({ ...filters, priceMin: v })} placeholder="Min $" className="w-20" />
        <span className="text-[var(--text-secondary)] text-xs">—</span>
        <NumInput value={filters.priceMax} onChange={(v) => onChange({ ...filters, priceMax: v })} placeholder="Max $" className="w-20" />
      </div>

      {/* ── Subtype ── */}
      <div className="flex gap-2 items-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10 shrink-0">Type</p>
        <input type="text" value={filters.subtype} onChange={(e) => onChange({ ...filters, subtype: e.target.value })} placeholder="e.g. Elf, Dragon" className={cn(inputCls, "flex-1")} />
      </div>

      {/* ── Keyword ability ── */}
      <div className="flex gap-2 items-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10 shrink-0">KW</p>
        <input type="text" value={filters.keyword} onChange={(e) => onChange({ ...filters, keyword: e.target.value })} placeholder="e.g. Flying, Trample" className={cn(inputCls, "flex-1")} />
      </div>

      {/* ── Power / Toughness — only when Creature type is active ── */}
      {showPowerToughness && (
        <>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10 shrink-0">Pow</p>
            <NumInput value={filters.powerMin} onChange={(v) => onChange({ ...filters, powerMin: v })} placeholder="Min" className="w-16" />
            <span className="text-[var(--text-secondary)] text-xs">—</span>
            <NumInput value={filters.powerMax} onChange={(v) => onChange({ ...filters, powerMax: v })} placeholder="Max" className="w-16" />
          </div>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10 shrink-0">Tou</p>
            <NumInput value={filters.toughnessMin} onChange={(v) => onChange({ ...filters, toughnessMin: v })} placeholder="Min" className="w-16" />
            <span className="text-[var(--text-secondary)] text-xs">—</span>
            <NumInput value={filters.toughnessMax} onChange={(v) => onChange({ ...filters, toughnessMax: v })} placeholder="Max" className="w-16" />
          </div>
        </>
      )}

      {/* ── Interaction archetype ── */}
      <div className="flex gap-2 items-center">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide w-10 shrink-0">Role</p>
        <select
          value={filters.interactionType ?? ""}
          onChange={(e) => onChange({ ...filters, interactionType: (e.target.value as InteractionType) || null })}
          className={cn(inputCls, "flex-1")}
        >
          {INTERACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ── Collection only ── */}
      {collectionSize > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onChange({ ...filters, collectionOnly: !filters.collectionOnly })}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors",
              filters.collectionOnly
                ? "border-green-500 text-green-400 bg-green-500/10"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-green-500/50"
            )}
          >
            <span className="text-sm">📦</span>
            {filters.collectionOnly ? "Collection only" : "Show collection only"}
          </button>
        </div>
      )}

      {/* ── Filter presets ── */}
      <div className="pt-1 space-y-2 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Presets</p>
        <div className="flex gap-1.5">
          <input
            type="text" value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSavePreset(); }}
            placeholder="Preset name…"
            className={cn(inputCls, "flex-1")}
          />
          <button
            type="button" onClick={handleSavePreset} disabled={!presetName.trim()}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
        {presets.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { handleLoadPreset(e.target.value); e.target.value = ""; } }}
            className={cn(inputCls, "w-full")}
          >
            <option value="" disabled>Load a preset…</option>
            {presets.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}
SearchFilters.displayName = "SearchFilters";

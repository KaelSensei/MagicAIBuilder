"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PackageOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";
import { CardPackageCreator } from "./CardPackageCreator";
import { CardPackageLibrary } from "./CardPackageLibrary";

interface CardPackagesPanelProps {
  readonly deckId: string;
  readonly cards: readonly DeckCard[];
  readonly onApplied?: () => void | Promise<void>;
}

export function CardPackagesPanel({ deckId, cards, onApplied }: CardPackagesPanelProps) {
  const t = useTranslations("deck.cardPackages");
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"library" | "mine" | "create">("library");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={expanded}>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <PackageOpen className="h-4 w-4 text-[var(--accent)]" /> {t("title")}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && (
        <div className="border-t border-[var(--border)] p-4 pt-3">
          <div className="mb-3 grid grid-cols-3 rounded-md bg-[var(--background)] p-1">
            {(["library", "mine", "create"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setMode(value)} className={`rounded px-2 py-1.5 text-xs ${mode === value ? "bg-[var(--surface-hover)] font-semibold" : "text-[var(--text-secondary)]"}`}>
                {t(value)}
              </button>
            ))}
          </div>
          {mode !== "create" ? (
            <CardPackageLibrary deckId={deckId} refreshKey={refreshKey} scope={mode} onApplied={onApplied} />
          ) : (
            <CardPackageCreator cards={cards} onCreated={() => { setRefreshKey((value) => value + 1); setMode("mine"); }} />
          )}
        </div>
      )}
    </section>
  );
}

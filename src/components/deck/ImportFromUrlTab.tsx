"use client";
// Import deck from supported URL sources (Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, EDHRec)
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Link2, CheckCheck, AlertTriangle } from "lucide-react";
import { fetchInBatches } from "@/lib/deck/batch-fetch";
import { useDeckStore } from "@/lib/deck/store";
import type { ScryfallCard } from "@/lib/scryfall/types";
import type { UrlImportCard, UrlImportResult } from "@/lib/import/url-import";
import { detectSource } from "@/lib/import/url-import";

const SOURCE_LABELS: Record<string, string> = {
  moxfield: "Moxfield",
  archidekt: "Archidekt",
  tappedout: "TappedOut",
  mtgtop8: "MTGTop8",
  mtgdecks: "MTGDecks",
  edhrec: "EDHRec",
};

type ImportStatus = "idle" | "loading" | "done" | "error";

interface ImportFromUrlTabProps {
  readonly onSuccess?: () => void;
}

function statusTextClass(status: ImportStatus): string {
  if (status === "error") return "text-red-400";
  if (status === "done") return "text-green-400";
  return "text-[var(--text-secondary)]";
}

export function ImportFromUrlTab({ onSuccess }: ImportFromUrlTabProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [message, setMessage] = useState("");
  const [ignored, setIgnored] = useState<readonly string[]>([]);
  const [formatWarning, setFormatWarning] = useState<string | null>(null);

  // Detect source from URL for live badge
  const detected = url.trim() ? detectSource(url.trim()) : null;

  const addCard = useDeckStore((s) => s.addCard);
  const setCommander = useDeckStore((s) => s.setCommander);
  const setPartner = useDeckStore((s) => s.setPartner);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);

  async function addUrlCards(
    importedCards: readonly UrlImportCard[],
    foundCards: ScryfallCard[]
  ): Promise<{ added: number; ignoredNames: string[] }> {
    const byName = new Map(foundCards.map((c) => [c.name.toLowerCase(), c]));
    const ignoredNames: string[] = [];
    let added = 0;

    const commanders = importedCards.filter((c) => c.isCommander && !c.isPartner);
    const partners = importedCards.filter((c) => c.isPartner);
    const rest = importedCards.filter((c) => !c.isCommander && !c.isPartner);

    for (const c of commanders) {
      const card = byName.get(c.name.toLowerCase());
      if (card) { await setCommander(card); added++; }
      else ignoredNames.push(c.name);
    }

    for (const c of partners) {
      const card = byName.get(c.name.toLowerCase());
      if (card) { await setPartner(card); added++; }
      else ignoredNames.push(c.name);
    }

    for (const c of rest) {
      const card = byName.get(c.name.toLowerCase());
      if (card) { addCard(card, c.quantity, c.zone); added++; }
      else ignoredNames.push(c.name);
    }

    return { added, ignoredNames };
  }

  const handleImport = async () => {
    if (!url.trim()) return;
    if (!activeDeckId) {
      setStatus("error");
      setMessage("No deck selected. Create or open a deck first.");
      return;
    }

    setStatus("loading");
    setMessage("Fetching deck…");
    setIgnored([]);

    try {
      const res = await fetch("/api/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const result = (await res.json()) as UrlImportResult;
      setFormatWarning(result.formatWarning ?? null);
      const cardNames = Array.from(
        new Set(result.cards.map((c) => c.name))
      ).map((name) => ({ name }));

      setMessage(`Validating ${cardNames.length} cards with Scryfall…`);
      const foundCards = await fetchInBatches(cardNames);

      const { added, ignoredNames } = await addUrlCards(result.cards, foundCards);
      setIgnored(ignoredNames);
      setStatus("done");
      const ignoredSuffix = ignoredNames.length > 0 ? `, ${ignoredNames.length} ignored` : "";
      setMessage(`Imported "${result.name}" — ${added} cards added${ignoredSuffix}.`);
      if (ignoredNames.length === 0) onSuccess?.();
    } catch (err) {
      setStatus("error");
      setFormatWarning(null);
      setMessage(err instanceof Error ? err.message : "Import failed.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--text-secondary)]">
        Paste a deck URL to import. Supported: Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, EDHRec.
      </p>

      {/* URL input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="https://www.moxfield.com/decks/… or moxfield publicId (e.g. AbCdEfGhIj)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            disabled={status === "loading"}
            className="w-full pl-9 pr-4 py-2 rounded border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <button
          onClick={handleImport}
          disabled={!url.trim() || status === "loading"}
          className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Import
        </button>
      </div>

      {/* Source badge */}
      {detected && (
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <CheckCheck className="w-3.5 h-3.5" />
          <span>{SOURCE_LABELS[detected.source] ?? detected.source} detected ✓</span>
        </div>
      )}
      {url.trim() && !detected && (
        <p className="text-xs text-amber-400">
          Source not recognised. Supported: Moxfield, Archidekt, TappedOut, MTGTop8, MTGDecks, EDHRec.
        </p>
      )}

      {/* Format warning */}
      {formatWarning && (
        <div className="flex items-start gap-2 text-xs text-amber-300 rounded border border-amber-500/30 bg-amber-500/10 p-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{formatWarning}</span>
        </div>
      )}

      {/* Status message */}
      {message && (
        <div className={`flex items-start gap-2 text-sm ${statusTextClass(status)}`}>
          {status === "loading" && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
          {status === "done" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          {status === "error" && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message}</span>
        </div>
      )}

      {/* Ignored cards list */}
      {ignored.length > 0 && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <p className="font-medium mb-1">Cards not found in Scryfall ({ignored.length}):</p>
          <ul className="space-y-0.5 max-h-24 overflow-y-auto">
            {ignored.map((name) => (
              <li key={name}>• {name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Supported sources note */}
      <p className="text-xs text-[var(--text-secondary)]">
        Supported:{" "}
        <span className="text-[var(--text-primary)]">moxfield.com</span> and{" "}
        <span className="text-[var(--text-primary)]">archidekt.com</span>. Deck must be public.
      </p>
    </div>
  );
}

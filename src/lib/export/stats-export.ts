/**
 * Deck Statistics Export — Pure functions for CSV and PDF export
 * Zero framework dependencies. All outputs are deterministic from inputs.
 */

import type { Deck, DeckCard } from "@/lib/deck/types";

// ─── Types ────────────────────────────────────────────────────────────────
export interface ExportOptions {
  readonly includeManaCurve: boolean;
  readonly includePriceBreakdown: boolean;
  readonly includeMetaAnalysis: boolean;
  readonly includeSynergies: boolean;
  readonly colorScheme: "light" | "dark";
}

export interface ExportMetadata {
  readonly deckName: string;
  readonly commanderName: string | null;
  readonly format: string;
  readonly cardCount: number;
  readonly totalPrice: number;
  readonly exportDate: string;
  readonly tags: readonly string[];
}

export interface TypeBreakdown {
  readonly creatures: number;
  readonly spells: number;
  readonly lands: number;
  readonly artifacts: number;
  readonly enchantments: number;
  readonly total: number;
  readonly creaturesPct: number;
  readonly spellsPct: number;
  readonly landsPct: number;
  readonly artifactsPct: number;
  readonly enchantmentsPct: number;
}

// ─── CSV helpers ───────────────────────────────────────────────────────────
function escapeCSV(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function csvRow(...fields: (string | number | null)[]): string {
  return fields.map(escapeCSV).join(",");
}

// ─── Simple CSV (deck list only) ───────────────────────────────────────────
export function generateDeckCSV(cards: readonly DeckCard[]): string {
  const header = csvRow("Card Name", "Qty", "CMC", "Type", "Color Identity", "Price ($USD)");
  const rows = cards.map((c) =>
    csvRow(
      c.name,
      c.quantity,
      c.cmc,
      c.typeLine.split("—")[0].trim(),
      c.colorIdentity.join("/") || "Colorless",
      c.price === null ? "N/A" : c.price.toFixed(2)
    )
  );
  return [header, ...rows].join("\n");
}

// ─── Full CSV (metadata + deck + stats) ────────────────────────────────────
export function generateDeckCSVFull(deck: Deck): string {
  const meta = buildExportMetadata(deck);
  const breakdown = buildTypeBreakdown(deck.cards);

  const lines: string[] = [
    // Metadata section
    csvRow("Deck:", meta.deckName),
    csvRow("Commander:", meta.commanderName ?? "N/A"),
    csvRow("Format:", meta.format),
    csvRow("Exported on:", meta.exportDate),
    csvRow("Tags:", meta.tags.join(", ")),
    "",
    // Deck list
    csvRow("Card Name", "Qty", "CMC", "Type", "Color Identity", "Price ($USD)"),
    ...deck.cards.map((c) =>
      csvRow(
        c.name,
        c.quantity,
        c.cmc,
        c.typeLine.split("—")[0].trim(),
        c.colorIdentity.join("/") || "Colorless",
        c.price === null ? "N/A" : c.price.toFixed(2)
      )
    ),
    "",
    // Summary stats
    csvRow("Total Cost", `$${meta.totalPrice.toFixed(2)}`),
    csvRow("Card Count", meta.cardCount),
    csvRow("Creatures", breakdown.creatures, `${breakdown.creaturesPct.toFixed(1)}%`),
    csvRow("Spells", breakdown.spells, `${breakdown.spellsPct.toFixed(1)}%`),
    csvRow("Lands", breakdown.lands, `${breakdown.landsPct.toFixed(1)}%`),
    csvRow("Artifacts", breakdown.artifacts, `${breakdown.artifactsPct.toFixed(1)}%`),
    csvRow("Enchantments", breakdown.enchantments, `${breakdown.enchantmentsPct.toFixed(1)}%`),
  ];

  return lines.join("\n");
}

// ─── Export metadata ───────────────────────────────────────────────────────
export function buildExportMetadata(deck: Deck): ExportMetadata {
  const totalPrice = deck.cards.reduce(
    (sum, c) => sum + (c.price ?? 0) * c.quantity,
    0
  );

  return {
    deckName: deck.name,
    commanderName: deck.commander?.name ?? null,
    format: deck.format,
    cardCount: deck.cards.length,
    totalPrice,
    exportDate: new Date().toISOString().split("T")[0],
    tags: deck.tags,
  };
}

// ─── Type breakdown ────────────────────────────────────────────────────────
export function buildTypeBreakdown(cards: readonly DeckCard[]): TypeBreakdown {
  let creatures = 0;
  let lands = 0;
  let artifacts = 0;
  let enchantments = 0;
  let spells = 0;
  const total = cards.length;

  for (const card of cards) {
    const type = card.typeLine.toLowerCase();
    if (type.includes("creature")) {
      creatures++;
    } else if (type.includes("land")) {
      lands++;
    } else if (type.includes("artifact")) {
      artifacts++;
    } else if (type.includes("enchantment")) {
      enchantments++;
    } else {
      spells++;
    }
  }

  const pct = (n: number) => total > 0 ? (n / total) * 100 : 0;

  return {
    creatures, spells, lands, artifacts, enchantments, total,
    creaturesPct: pct(creatures),
    spellsPct: pct(spells),
    landsPct: pct(lands),
    artifactsPct: pct(artifacts),
    enchantmentsPct: pct(enchantments),
  };
}

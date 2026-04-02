/**
 * Server-safe proxy print HTML builder (unit-testable, no React).
 */
import { cardsPerPage, type ProxyConfig, type ProxySlot } from "./proxy";

const PAPER_SIZES: Record<ProxyConfig["paper"], { w: string; h: string }> = {
  a4: { w: "210mm", h: "297mm" },
  letter: { w: "8.5in", h: "11in" },
};

const LAYOUT_COLS: Record<ProxyConfig["layout"], number> = {
  "3x3": 3,
  "2x2": 2,
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function oracleToHtml(oracle: string): string {
  return escapeHtml(oracle).replaceAll("\n", "<br/>");
}

function chunkArray<T>(arr: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** Render one slot — exported for focused unit tests */
export function renderProxyCardSlotHtml(
  slot: ProxySlot,
  imageMap: ReadonlyMap<string, string>,
  includeCardArt: boolean
): string {
  const src = includeCardArt ? imageMap.get(slot.imageUri) : undefined;
  if (src) {
    const alt = escapeHtml(slot.name);
    return `<div class="card-slot"><img src="${src}" alt="${alt}" class="card-img" /></div>`;
  }
  const name = escapeHtml(slot.name);
  const cost = escapeHtml(slot.manaCost);
  const type = escapeHtml(slot.typeLine);
  const oracleHtml = oracleToHtml(slot.oracleText);
  const oracleBlock =
    oracleHtml.trim().length > 0
      ? oracleHtml
      : `<span class="fallback-empty">(no rules text)</span>`;
  const ptBox =
    slot.powerToughness !== null && slot.powerToughness.length > 0
      ? `<div class="fallback-pt">${escapeHtml(slot.powerToughness)}</div>`
      : "";
  return `<div class="card-slot"><div class="card-fallback"><div class="fallback-header"><div class="fallback-name">${name}</div><div class="fallback-cost">${cost}</div></div><div class="fallback-type">${type}</div><div class="fallback-text">${oracleBlock}</div>${ptBox}</div></div>`;
}

/**
 * Full print document HTML for proxy sheets (same output as browser print flow).
 *
 * @param deckName Sanitized deck name for the HTML document title
 */
export function buildProxyPrintDocumentHtml(
  slots: readonly ProxySlot[],
  imageMap: ReadonlyMap<string, string>,
  config: ProxyConfig,
  deckName: string
): string {
  const paper = PAPER_SIZES[config.paper];
  const cols = LAYOUT_COLS[config.layout];
  const perPage = cardsPerPage(config.layout);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${deckName} — Proxies</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #fff;
    font-family: sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: ${paper.w};
    min-height: ${paper.h};
    padding: 5mm;
    display: grid;
    grid-template-columns: repeat(${cols}, 63mm);
    gap: 2mm;
    align-content: start;
    background: #fff;
    page-break-after: always;
  }

  .card-slot {
    width: 63mm;
    height: 88mm;
    overflow: hidden;
    border-radius: 3mm;
    border: 0.3mm solid #ccc;
    break-inside: avoid;
    background: #111;
    position: relative;
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card-fallback {
    width: 100%;
    height: 100%;
    background: #1a1815;
    color: #e8e4dc;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 2mm 2.5mm 7mm;
    text-align: left;
    gap: 1mm;
    position: relative;
    border: 0.4mm solid #333;
  }

  .fallback-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5mm;
  }

  .fallback-name {
    font-size: 6.5pt;
    font-weight: 700;
    line-height: 1.15;
    flex: 1;
    min-width: 0;
  }

  .fallback-cost {
    font-size: 6pt;
    color: #c9c4be;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .fallback-type {
    font-size: 5.5pt;
    color: #a39e96;
    font-style: italic;
    border-bottom: 0.15mm solid #444;
    padding-bottom: 0.8mm;
    margin-bottom: 0.5mm;
  }

  .fallback-text {
    font-size: 4.5pt;
    line-height: 1.2;
    color: #d5d0c8;
    flex: 1;
    overflow: hidden;
    max-height: 56mm;
  }

  .fallback-empty { color: #666; font-style: italic; }

  .fallback-pt {
    position: absolute;
    bottom: 2mm;
    right: 2.5mm;
    font-size: 7pt;
    font-weight: 800;
    background: #c9c4be;
    color: #111;
    padding: 0.6mm 1.8mm;
    border-radius: 0.9mm;
    line-height: 1;
    border: 0.12mm solid #888;
  }

  .page-footer {
    grid-column: 1 / -1;
    font-size: 5pt;
    color: #999;
    text-align: center;
    padding-top: 1mm;
  }

  @media print {
    @page {
      size: ${paper.w} ${paper.h};
      margin: 0;
    }
    body { background: #fff !important; }
    .page { page-break-after: always; padding: 5mm; }
    .card-slot { break-inside: avoid; }
    .page-footer { display: block; }
  }
</style>
</head>
<body>
${chunkArray(slots, perPage)
  .map(
    (pageSlots) =>
      `<div class="page">${pageSlots.map((slot) => renderProxyCardSlotHtml(slot, imageMap, config.includeCardArt)).join("")}<div class="page-footer">Unofficial proxy — Not for sale — MagicAIBuilder</div></div>`
  )
  .join("\n")}
</body>
</html>`;
}

"use client";
/**
 * ProxyExportModal — print-ready proxy sheet export.
 *
 * Generates an HTML page with CSS @media print styles sized exactly
 * to 63×88mm per card (Magic card standard).
 * Uses window.print() — user can "Save as PDF" via browser dialog.
 * Zero external dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, Loader2, AlertCircle } from "lucide-react";
import type { Deck } from "@/lib/deck/types";
import {
  buildProxySlots,
  localizeProxySlots,
  estimatePages,
  cardsPerPage,
  DEFAULT_PROXY_CONFIG,
} from "@/lib/deck/proxy";
import type { ProxyConfig, ProxySlot } from "@/lib/deck/proxy";
import { useLocalizedDeckIndex } from "@/hooks/useLocalizedDeckIndex";
import { buildProxyPrintDocumentHtml } from "@/lib/deck/proxy-print-html";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";

// ─── Image preloading ─────────────────────────────────────────────────────────

interface ImageState {
  loaded: number;
  total: number;
  failed: Set<string>; // Scryfall image URLs that failed (after proxy)
}

/**
 * Same-origin proxy: browser `fetch()` to `cards.scryfall.io` is blocked by CORS,
 * so we load bytes via `/api/proxy-card-image` and convert to data URLs for print.
 *
 * @param scryfallImageUrl Absolute Scryfall CDN URL stored on the deck card
 */
function proxyImageRequestUrl(scryfallImageUrl: string): string {
  return `/api/proxy-card-image?url=${encodeURIComponent(scryfallImageUrl)}`;
}

async function preloadImages(
  slots: readonly ProxySlot[],
  onProgress: (state: ImageState) => void,
  signal: AbortSignal
): Promise<Map<string, string>> {
  const urlToDataUrl = new Map<string, string>();
  const uniqueUrls = [...new Set(slots.map((s) => s.imageUri).filter(Boolean))];
  const failed = new Set<string>();
  let loaded = 0;
  const total = uniqueUrls.length;

  await Promise.all(
    uniqueUrls.map(async (url) => {
      if (signal.aborted) return;
      try {
        const res = await fetch(proxyImageRequestUrl(url), {
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("FileReader result is not a string"));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        urlToDataUrl.set(url, dataUrl);
      } catch {
        failed.add(url);
      } finally {
        if (!signal.aborted) {
          loaded++;
          onProgress({ loaded, total, failed: new Set(failed) });
        }
      }
    })
  );

  return urlToDataUrl;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ProxyExportModalProps {
  readonly deck: Deck;
  readonly onClose: () => void;
}

/**
 * Tag renderer for the summary line's emphasised page count.
 *
 * Module scope, not inline: a renderer created in the render body is a new
 * function identity each pass and reads as a component defined in a component.
 */
const PROXY_RICH_TAGS = {
  strong: (chunks: ReactNode) => (
    <strong className="text-[var(--text-primary)]">{chunks}</strong>
  ),
};

export function ProxyExportModal({ deck, onClose }: ProxyExportModalProps) {
  const t = useTranslations("deck");
  const [config, setConfig] = useState<ProxyConfig>(DEFAULT_PROXY_CONFIG);
  const [imgState, setImgState] = useState<ImageState | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imageMapRef = useRef<Map<string, string>>(new Map());

  // Proxies are printed in the viewer's language where a printing exists —
  // the batch is the same one the deck editor already ran, so it is cached.
  const cardNames = useMemo(
    () =>
      [deck.commander, deck.partner, ...deck.cards]
        .filter((c) => c !== null && c !== undefined)
        .map((c) => c.name),
    [deck.commander, deck.partner, deck.cards]
  );
  const localizedIndex = useLocalizedDeckIndex(cardNames);
  const slots = localizeProxySlots(
    buildProxySlots(deck.cards, deck.commander, deck.partner, config),
    localizedIndex
  );
  const pageCount = estimatePages(slots.length, config.layout);
  const deckName = deck.name.replaceAll(/[^a-z0-9]/gi, "_").toLowerCase();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const includeArtRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (includeArtRef.current === null) {
      includeArtRef.current = config.includeCardArt;
      return;
    }
    if (includeArtRef.current === config.includeCardArt) return;
    includeArtRef.current = config.includeCardArt;
    abortRef.current?.abort();
    setImgState(null);
    imageMapRef.current = new Map();
    setError(null);
    setIsPreparing(false);
  }, [config.includeCardArt]);

  const handlePrepare = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsPreparing(true);
    setError(null);
    const uniqueImageCount = new Set(
      slots.map((s) => s.imageUri).filter(Boolean)
    ).size;
    setImgState({ loaded: 0, total: uniqueImageCount, failed: new Set() });
    imageMapRef.current = new Map();

    try {
      const map = await preloadImages(
        slots,
        setImgState,
        abortRef.current.signal
      );
      imageMapRef.current = map;
    } catch (err) {
      if (!abortRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : "Image loading failed");
      }
    } finally {
      if (!abortRef.current?.signal.aborted) setIsPreparing(false);
    }
  }, [slots]);

  const handlePrint = useCallback(() => {
    const html = buildProxyPrintDocumentHtml(
      slots,
      imageMapRef.current,
      config,
      deckName
    );
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      setError("Pop-up blocked — allow pop-ups for this site");
      return;
    }
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const onLoad = (): void => {
      win.focus();
      setTimeout(() => {
        win.print();
        URL.revokeObjectURL(objectUrl);
      }, 500);
    };
    win.addEventListener("load", onLoad, { once: true });
    win.location.assign(objectUrl);
  }, [slots, config, deckName]);

  const imagesReady =
    !isPreparing && imgState !== null && imgState.loaded === imgState.total;

  const canPrint = slots.length > 0 && (!config.includeCardArt || imagesReady);

  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[460px] max-w-[92vw] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Printer className="w-4 h-4 text-[var(--accent)]" />
              {t("proxy.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {t("proxy.description")}
          </Dialog.Description>

          {/* Config */}
          <div className="space-y-4">
            {/* Paper */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0">
                {t("proxy.paper")}
              </span>
              <div className="flex gap-1.5">
                {(["a4", "letter"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setConfig((c) => ({ ...c, paper: p }))}
                    className={cn(
                      "px-3 py-1 rounded text-xs border transition-colors",
                      config.paper === p
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                    )}
                  >
                    {p === "a4" ? "A4" : "Letter"}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0">
                {t("proxy.layout")}
              </span>
              <div className="flex gap-1.5">
                {(["3x3", "2x2"] as const).map((l) => (
                  <button
                    type="button"
                    key={l}
                    onClick={() => setConfig((c) => ({ ...c, layout: l }))}
                    className={cn(
                      "px-3 py-1 rounded text-xs border transition-colors",
                      config.layout === l
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                    )}
                  >
                    {l} ({cardsPerPage(l)}/page)
                  </button>
                ))}
              </div>
            </div>

            {/* Quality — only affects Scryfall image size when card art is on */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0">
                {t("proxy.quality")}
              </span>
              <div className="flex gap-1.5">
                {(["standard", "high"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={!config.includeCardArt}
                    onClick={() => setConfig((c) => ({ ...c, quality: q }))}
                    className={cn(
                      "px-3 py-1 rounded text-xs border transition-colors",
                      !config.includeCardArt && "opacity-40 cursor-not-allowed",
                      config.quality === q
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                    )}
                  >
                    {t(`proxy.qualityOption.${q}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Card art vs text-only (no preload for text-only) */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0">
                {t("proxy.content")}
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({ ...c, includeCardArt: true }))
                  }
                  className={cn(
                    "px-3 py-1 rounded text-xs border transition-colors",
                    config.includeCardArt
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                  )}
                >
                  {t("proxy.cardArt")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({ ...c, includeCardArt: false }))
                  }
                  className={cn(
                    "px-3 py-1 rounded text-xs border transition-colors",
                    config.includeCardArt
                      ? "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                      : "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  )}
                >
                  {t("proxy.textOnly")}
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              {(
                [
                  { key: "includeLands", labelKey: "proxy.includeBasics" },
                  { key: "includeCommander", labelKey: "proxy.includeCommander" },
                ] as const
              ).map(({ key, labelKey }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config[key]}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, [key]: e.target.checked }))
                    }
                    className="w-3.5 h-3.5 accent-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    {t(labelKey)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-secondary)] flex items-center justify-between">
            <span>
              {t.rich("proxy.summary", {
                cards: slots.length,
                pages: pageCount,
                layout: config.layout,
                strong: PROXY_RICH_TAGS.strong,
              })}
            </span>
            {slots.length === 0 && (
              <span className="text-amber-400">{t("proxy.noCards")}</span>
            )}
          </div>

          {/* Progress — only when loading art */}
          {config.includeCardArt && imgState && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>
                  {t("proxy.loadingImages", {
                    loaded: imgState.loaded,
                    total: imgState.total,
                  })}
                </span>
                {imgState.failed.size > 0 && (
                  <span className="text-amber-400">
                    {t("proxy.imagesFailed", { count: imgState.failed.size })}
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-200 rounded-full"
                  style={{
                    width:
                      imgState.total > 0
                        ? `${(imgState.loaded / imgState.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrepare}
              disabled={
                isPreparing || slots.length === 0 || !config.includeCardArt
              }
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all border",
                isPreparing || slots.length === 0 || !config.includeCardArt
                  ? "border-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed opacity-50"
                  : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10"
              )}
            >
              {isPreparing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("proxy.loading")}
                </>
              ) : (
                t("proxy.preload")
              )}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canPrint}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                canPrint
                  ? "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                  : "bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed opacity-50"
              )}
            >
              <Printer className="w-3.5 h-3.5" />
              {t("proxy.print")}
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] text-center">
            {config.includeCardArt ? t("proxy.hintArt") : t("proxy.hintTextOnly")}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

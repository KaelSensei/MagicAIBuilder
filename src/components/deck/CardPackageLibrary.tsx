"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface PackageSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly isPublic?: boolean;
  readonly author: { readonly username: string | null; readonly name: string | null };
  readonly cards: readonly unknown[];
}

interface PreviewCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly status: "ready" | "blocked";
  readonly issues: readonly { readonly kind: string }[];
}

interface CardPackageLibraryProps {
  readonly deckId: string;
  readonly refreshKey: number;
  readonly scope: "library" | "mine";
  readonly onApplied?: () => void | Promise<void>;
}

export function CardPackageLibrary({ deckId, refreshKey, scope, onApplied }: CardPackageLibraryProps) {
  const t = useTranslations("deck.cardPackages");
  const [packages, setPackages] = useState<readonly PackageSummary[]>([]);
  const [preview, setPreview] = useState<readonly PreviewCard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"loading" | "idle" | "previewing" | "applying" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(scope === "mine" ? "/api/community/card-packages?scope=mine" : "/api/community/card-packages")
      .then((response) => {
        if (!response.ok) throw new Error("load failed");
        return response.json() as Promise<PackageSummary[]>;
      })
      .then((data) => {
        if (!cancelled) {
          setPackages(data);
          setStatus("idle");
        }
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [refreshKey, scope]);

  const loadPreview = async (packageId: string) => {
    setStatus("previewing");
    try {
      const response = await fetch(`/api/community/card-packages/${packageId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      });
      if (!response.ok) throw new Error("preview failed");
      const data = await response.json() as { cards: PreviewCard[] };
      setActiveId(packageId);
      setPreview(data.cards);
      setSelectedIds(new Set(data.cards.filter((card) => card.status === "ready").map((card) => card.scryfallId)));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const apply = async () => {
    if (!activeId || selectedIds.size === 0) return;
    setStatus("applying");
    try {
      const response = await fetch(`/api/community/card-packages/${activeId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, acceptedScryfallIds: [...selectedIds] }),
      });
      if (!response.ok) throw new Error("apply failed");
      setPreview([]);
      setActiveId(null);
      setStatus("idle");
      await onApplied?.();
    } catch {
      setStatus("error");
    }
  };

  if (status === "loading") return <p className="text-xs text-[var(--text-secondary)]">{t("loading")}</p>;
  if (packages.length === 0 && status !== "error") return <p className="text-xs text-[var(--text-secondary)]">{t(scope === "mine" ? "emptyMine" : "empty")}</p>;

  return (
    <div className="space-y-2">
      {packages.map((cardPackage) => (
        <article key={cardPackage.id} className="rounded-md border border-[var(--border)] p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{cardPackage.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {t(`categories.${cardPackage.category}`)} · {cardPackage.author.username ?? cardPackage.author.name ?? t("anonymous")}
                {scope === "mine" && !cardPackage.isPublic ? ` · ${t("private")}` : ""}
              </p>
            </div>
            <button type="button" onClick={() => void loadPreview(cardPackage.id)} className="rounded border border-[var(--border)] px-2 py-1 text-[11px] hover:bg-[var(--surface-hover)]">
              {status === "previewing" ? t("previewing") : t("preview")}
            </button>
          </div>
          {activeId === cardPackage.id && preview.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-[var(--border)] pt-2">
              {preview.map((card) => (
                <label key={card.scryfallId} className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    aria-label={`${card.name} (${card.status})`}
                    disabled={card.status === "blocked"}
                    checked={selectedIds.has(card.scryfallId)}
                    onChange={() => setSelectedIds((current) => {
                      const next = new Set(current);
                      if (next.has(card.scryfallId)) next.delete(card.scryfallId); else next.add(card.scryfallId);
                      return next;
                    })}
                  />
                  <span className="flex-1">{card.name} <span className={card.status === "ready" ? "text-emerald-400" : "text-amber-400"}>· {t(card.status)}</span></span>
                </label>
              ))}
              <button type="button" disabled={selectedIds.size === 0 || status === "applying"} onClick={() => void apply()} className="mt-2 w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
                {status === "applying" ? t("applying") : t("apply", { count: selectedIds.size })}
              </button>
            </div>
          )}
        </article>
      ))}
      {status === "error" && <p className="text-xs text-red-400">{t("loadError")}</p>}
    </div>
  );
}

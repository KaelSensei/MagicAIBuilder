"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { DeckCard } from "@/lib/deck/types";

interface CardPackageCreatorProps {
  readonly cards: readonly DeckCard[];
  readonly onCreated: () => void;
}

const CATEGORIES = ["mana-base", "interaction", "tribal", "combo", "other"] as const;

export function CardPackageCreator({ cards, onCreated }: CardPackageCreatorProps) {
  const t = useTranslations("deck.cardPackages");
  const eligibleCards = cards.filter((card) => card.scryfallId);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("other");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  const toggleCard = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    const selected = eligibleCards.filter((card) => selectedIds.has(card.id));
    if (!name.trim() || selected.length === 0) return;
    setStatus("saving");
    try {
      const response = await fetch("/api/community/card-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: "",
          category,
          isPublic,
          cards: selected.map((card) => ({
            scryfallId: card.scryfallId,
            name: card.name,
            quantity: card.quantity,
            colorIdentity: card.colorIdentity,
            isBanned: card.isBanned,
            isBasicLand: card.typeLine.toLowerCase().includes("basic land"),
            imageUri: card.imageUri,
          })),
        }),
      });
      if (!response.ok) throw new Error("create failed");
      setName("");
      setSelectedIds(new Set());
      setStatus("idle");
      onCreated();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-3">
      <input
        aria-label={t("name")}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t("name")}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs"
      />
      <div className="flex gap-2">
        <select
          aria-label={t("category")}
          value={category}
          onChange={(event) => setCategory(event.target.value as typeof category)}
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-xs"
        >
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>{t(`categories.${value}`)}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          {t("public")}
        </label>
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-[var(--border)] p-2">
        {eligibleCards.map((card) => (
          <label key={card.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-[var(--surface-hover)]">
            <input
              type="checkbox"
              aria-label={`${card.name} (${card.quantity})`}
              checked={selectedIds.has(card.id)}
              onChange={() => toggleCard(card.id)}
            />
            <span className="min-w-0 flex-1 truncate">{card.name}</span>
            <span className="text-[var(--text-secondary)]">×{card.quantity}</span>
          </label>
        ))}
      </div>
      {status === "error" && <p className="text-xs text-red-400">{t("saveError")}</p>}
      <button
        type="button"
        disabled={!name.trim() || selectedIds.size === 0 || status === "saving"}
        onClick={() => void save()}
        className="w-full rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
      >
        {status === "saving" ? t("saving") : t("save")}
      </button>
    </div>
  );
}

"use client";
// Modal to select a card printing — shows oracle text alongside all printings
import { useEffect, useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { useCardPrintings } from "@/hooks/useCardPrintings";
import { getCardImageUri } from "@/lib/scryfall/images";
import { resolveLocalizedText, toScryfallLang } from "@/lib/scryfall/localized";
import { Modal } from "@/components/ui/Modal";


interface PrintingSelectorModalProps {
  readonly card: ScryfallCard;
  readonly onSelect: (card: ScryfallCard) => void;
  readonly onClose: () => void;
}

import { ManaCostDisplay } from "./ManaSymbol";

export function PrintingSelectorModal({
  card,
  onSelect,
  onClose,
}: PrintingSelectorModalProps) {
  const t = useTranslations("card");
  const format = useFormatter();
  const { data, isLoading } = useCardPrintings(card.name, toScryfallLang(useLocale()));
  const [previewedPrintingId, setPreviewedPrintingId] = useState(card.id);

  const printings = useMemo(() => data?.data ?? [card], [card, data?.data]);
  const previewedPrinting = useMemo(
    () =>
      printings.find((printing) => printing.id === previewedPrintingId) ??
      printings[0] ??
      card,
    [card, previewedPrintingId, printings]
  );

  useEffect(() => {
    setPreviewedPrintingId(card.id);
  }, [card.id]);

  // Read the previewed printing, not the card the modal was opened with: with
  // localised printings in the list, picking one has to change the text shown.
  const face = previewedPrinting.card_faces?.[0];
  const manaCost = face?.mana_cost ?? previewedPrinting.mana_cost ?? "";
  const { name, typeLine, oracleText } = resolveLocalizedText(previewedPrinting);

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth="max-w-5xl"
      showClose={false}
      className="max-h-[90vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--border) shrink-0">
        <div>
          <h2 className="text-base font-semibold text-(--text-primary)">
            {name}
          </h2>
          <p className="text-xs text-(--text-secondary) mt-0.5">
            {isLoading
              ? t("loadingPrintings")
              : t("printingsAvailable", { count: printings.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-(--text-secondary) hover:text-(--text-primary) transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Oracle text */}
        <div className="w-64 shrink-0 border-r border-(--border) p-4 flex flex-col gap-3 overflow-y-auto">
          {manaCost && (
            <div>
              <ManaCostDisplay manaCost={manaCost} />
            </div>
          )}
          <p className="text-xs font-medium text-(--text-primary) italic border-b border-(--border) pb-2">
            {typeLine}
          </p>

          {oracleText ? (
            <p className="text-xs text-(--text-secondary) leading-relaxed whitespace-pre-line">
              {oracleText}
            </p>
          ) : (
            <p className="text-xs text-(--text-secondary) italic opacity-50">
              {t("noText")}
            </p>
          )}

          {card.prices?.usd && (
            <p className="text-xs text-(--accent) mt-auto pt-2 border-t border-(--border)">
              {format.number(Number.parseFloat(card.prices.usd), {
                style: "currency",
                currency: "USD",
              })}
            </p>
          )}
        </div>

        {/* Right — Printings grid + desktop hover preview */}
        <div className="flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-(--accent)" />
            </div>
          ) : (
            <div className="flex h-full gap-4">
              <div className="min-w-0 flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-4">
                  {printings.map((printing) => (
                    <div key={printing.id} className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(printing);
                          onClose();
                        }}
                        onMouseEnter={() => setPreviewedPrintingId(printing.id)}
                        className="relative rounded-[4.75%] overflow-hidden border-2 transition-all focus:outline-none"
                        style={{
                          borderColor:
                            previewedPrinting.id === printing.id
                              ? "var(--accent)"
                              : "transparent",
                          transform:
                            previewedPrinting.id === printing.id
                              ? "scale(1.04)"
                              : "scale(1)",
                          boxShadow:
                            previewedPrinting.id === printing.id
                              ? "0 0 12px var(--accent)40"
                              : "none",
                        }}
                      >
                        <Image
                          src={getCardImageUri(printing, "normal")}
                          alt={`${printing.name} — ${printing.set_name}`}
                          width={220}
                          height={308}
                          className="block w-full h-auto"
                          unoptimized
                        />
                      </button>
                      <p className="text-[10px] text-(--text-secondary) text-center truncate uppercase tracking-wide">
                        {printing.set}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="hidden lg:flex w-72 shrink-0 flex-col rounded-xl border border-(--border) bg-(--surface) p-3">
                <div className="overflow-hidden rounded-[4.75%] border border-(--border)">
                  <Image
                    src={getCardImageUri(previewedPrinting, "large")}
                    alt={`${previewedPrinting.name} — enlarged preview`}
                    width={336}
                    height={468}
                    className="block w-full h-auto"
                    unoptimized
                  />
                </div>
                <div className="pt-3">
                  <p className="text-sm font-medium text-(--text-primary)">
                    {previewedPrinting.set_name ?? previewedPrinting.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-(--text-secondary)">
                    {previewedPrinting.set}
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

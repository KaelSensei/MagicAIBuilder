"use client";

import { useTranslations } from "next-intl";
import type { AcquisitionChoice, AcquisitionMode } from "@/lib/collection/acquisition-intent";
import type { ShoppingListItem } from "@/lib/collection/shopping-list";

interface ShoppingListRowProps {
  readonly item: ShoppingListItem;
  readonly money: (value: number) => string;
  readonly intent: AcquisitionMode | undefined;
  readonly onSetIntent: (mode: AcquisitionChoice) => void;
}

/**
 * One missing printing on the buy list, with proxy and buy-later toggles.
 *
 * @param props - the line, its price formatter, and the current intent
 * @returns the row
 */
export function ShoppingListRow({ item, money, intent, onSetIntent }: ShoppingListRowProps) {
  const t = useTranslations("deck");
  const lineTotal = item.price === null ? null : item.price * item.quantity;

  return (
    <div className={`flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[var(--surface-hover)] transition-colors ${intent ? "opacity-60" : ""}`}>
      <span className="text-xs text-[var(--text-secondary)] w-5 text-center shrink-0">
        {item.quantity}×
      </span>
      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
        {item.name}
      </span>
      <span className="text-xs text-[var(--text-secondary)] shrink-0 tabular-nums">
        {item.price === null ? "—" : money(item.price)}
      </span>
      {typeof lineTotal === "number" && item.quantity > 1 ? (
        <span className="text-[10px] text-[var(--text-secondary)] shrink-0 tabular-nums w-14 text-right">
          ({money(lineTotal)})
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onSetIntent(intent === "proxy_now" ? "buy_now" : "proxy_now")}
        aria-pressed={intent === "proxy_now"}
        aria-label={t(intent === "proxy_now" ? "buyList.buyNowNamed" : "buyList.proxyNowNamed", { name: item.name })}
        className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        {t(intent === "proxy_now" ? "buyList.buyNow" : "buyList.proxyNow")}
      </button>
      <button
        type="button"
        onClick={() => onSetIntent(intent === "buy_later" ? "buy_now" : "buy_later")}
        aria-pressed={intent === "buy_later"}
        aria-label={t(intent === "buy_later" ? "buyList.buyNowNamed" : "buyList.buyLaterNamed", { name: item.name })}
        className="shrink-0 rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        {t(intent === "buy_later" ? "buyList.buyNow" : "buyList.buyLater")}
      </button>
    </div>
  );
}

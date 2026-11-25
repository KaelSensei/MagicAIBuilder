"use client";
/**
 * The acquisition plan's "Deferred" group: copies a deck's owner chose to proxy
 * now or buy later in that deck's shopping list. Read-only; the choice is
 * changed in the deck, not here, so each deck's name links to its builder, as
 * in the buy-now list. The choice is named in words, never by colour.
 *
 * @module components/collection/DeferredPlanGroup
 */
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { AcquisitionMode } from "@/lib/collection/acquisition-intent";
import { DeckBuilderLink } from "./DeckBuilderLink";

/** One deck's deferred copies of a printing, as the plan route answers them. */
export interface DeferredPlanDeck {
  readonly id: string;
  readonly name: string;
  readonly mode: AcquisitionMode;
  readonly quantity: number;
}

/** A plan line with at least one deferred copy. */
export interface DeferredPlanLine {
  readonly scryfallId: string;
  readonly name: string;
  readonly deferred: readonly DeferredPlanDeck[];
}

interface DeferredPlanGroupProps {
  readonly items: readonly DeferredPlanLine[];
  /** Deferred copies across `items`. */
  readonly copyCount: number;
}

/** The label key for each choice; typed as a full record so a new mode fails to compile. */
const LABEL_KEY: Readonly<
  Record<AcquisitionMode, "proxyNowFor" | "buyLaterFor">
> = {
  proxy_now: "proxyNowFor",
  buy_later: "buyLaterFor",
};

/**
 * The `<link>` tag handler of `proxyNowFor` and `buyLaterFor`: the deck's name
 * links to its builder, where the deferred choice is changed. It is built out
 * here, so the group declares no component while it renders (Sonar S6478).
 */
function deckBuilderLinkTag(deckId: string) {
  return function renderDeckBuilderLink(chunks: ReactNode) {
    return <DeckBuilderLink deckId={deckId}>{chunks}</DeckBuilderLink>;
  };
}

/**
 * Lists the deferred copies by printing, each under its deck's choice.
 *
 * Renders nothing when no copy is deferred.
 */
export function DeferredPlanGroup({
  items,
  copyCount,
}: DeferredPlanGroupProps) {
  const t = useTranslations("collection.acquisitionPlan");
  const usage = useTranslations("collection.usage");
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="collection-acquisition-plan-deferred"
      className="mt-4 border-t border-[var(--border)] pt-3"
    >
      <h3
        id="collection-acquisition-plan-deferred"
        className="text-sm font-medium text-[var(--text-primary)]"
      >
        {t("deferredTitle", { count: copyCount })}
      </h3>
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        {t("deferredHint")}
      </p>
      <ul className="max-h-60 divide-y divide-[var(--border)] overflow-y-auto">
        {items.map((item) => (
          <li key={item.scryfallId} className="py-2 text-sm">
            <p className="font-medium text-[var(--text-primary)]">
              {item.name}
            </p>
            {item.deferred.map((deck) => (
              <p key={deck.id} className="text-xs text-[var(--text-secondary)]">
                <span>
                  {t.rich(LABEL_KEY[deck.mode], {
                    deck: deck.name,
                    link: deckBuilderLinkTag(deck.id),
                  })}
                </span>
                <span className="ml-1">
                  {usage("copies", { count: deck.quantity })}
                </span>
              </p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

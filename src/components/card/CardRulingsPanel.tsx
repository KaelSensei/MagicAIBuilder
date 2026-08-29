"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getCardRulings,
  type CardRulingsResult,
} from "@/lib/scryfall/rulings";

/** Props for the on-demand card rulings panel. */
interface CardRulingsPanelProps {
  readonly cardId: string;
}

type RulingsPanelState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly result: CardRulingsResult }
  | { readonly status: "error" };

/**
 * Loads Oracle rulings on demand and identifies offline cached results.
 *
 * @param props - Scryfall printing identifier used for the rulings lookup.
 * @returns A compact rulings disclosure panel.
 */
export function CardRulingsPanel({ cardId }: CardRulingsPanelProps) {
  const t = useTranslations("card.rulings");
  const [state, setState] = useState<RulingsPanelState>({ status: "idle" });

  const handleLoad = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const result = await getCardRulings(cardId);
      setState({ status: "success", result });
    } catch {
      setState({ status: "error" });
    }
  }, [cardId]);

  if (state.status === "idle") {
    return (
      <button
        type="button"
        onClick={handleLoad}
        className="text-left text-xs font-medium text-(--accent) hover:underline"
      >
        {t("show")}
      </button>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-xs text-(--text-secondary)">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-1 text-xs text-red-400">
        <p>{t("error")}</p>
        <button type="button" onClick={handleLoad} className="hover:underline">
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-(--border) pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-(--text-primary)">{t("title")}</p>
        {state.result.source === "cache" && (
          <span className="rounded bg-(--surface-hover) px-1.5 py-0.5 text-[10px] text-(--text-secondary)">
            {t("offline")}
          </span>
        )}
      </div>
      {state.result.rulings.length === 0 ? (
        <p className="text-xs italic text-(--text-secondary)">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {state.result.rulings.map((ruling) => (
            <li key={`${ruling.publishedAt}:${ruling.comment}`}>
              <p className="text-[10px] text-(--text-secondary)">
                {ruling.publishedAt}
              </p>
              <p className="text-xs leading-relaxed text-(--text-secondary)">
                {ruling.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

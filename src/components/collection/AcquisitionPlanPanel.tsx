"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { z } from "zod";

const planSchema = z.object({
  deckCount: z.number().int().nonnegative(),
  items: z.array(z.object({
    scryfallId: z.string(),
    name: z.string(),
    requiredQuantity: z.number().int().nonnegative(),
    ownedQuantity: z.number().int().nonnegative(),
    acquireQuantity: z.number().int().positive(),
    price: z.number().nonnegative().nullable(),
    decks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
    })),
  })),
});

type Plan = z.infer<typeof planSchema>;
type PlanState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly plan: Plan };

/** Read-only, on-demand view of copies still needed across the player's decks. */
export function AcquisitionPlanPanel() {
  const t = useTranslations("collection.acquisitionPlan");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<PlanState>({ status: "loading" });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ status: "loading" });

    async function loadPlan() {
      try {
        const response = await fetch("/api/collection/acquisition-plan", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Acquisition plan request failed");
        const parsed = planSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid acquisition plan response");
        if (!controller.signal.aborted) setState({ status: "ready", plan: parsed.data });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }

    void loadPlan();
    return () => controller.abort();
  }, [open, refreshKey]);

  const items = state.status === "ready" ? state.plan.items : [];
  const missingCount = items.reduce((sum, item) => sum + item.acquireQuantity, 0);
  const unpricedCount = items.reduce(
    (sum, item) => sum + (item.price === null ? item.acquireQuantity : 0),
    0
  );
  const knownCost = items.reduce(
    (sum, item) => sum + (item.price ?? 0) * item.acquireQuantity,
    0
  );

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="collection-acquisition-plan"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {t("title")}
      </button>
      {open && (
        <div id="collection-acquisition-plan" className="border-t border-[var(--border)] px-4 pb-4 pt-3">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-2xl text-xs text-[var(--text-secondary)]">{t("description")}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {state.status === "error" ? t("retry") : t("refresh")}
            </button>
          </div>
          {state.status === "loading" && <p role="status" className="text-sm text-[var(--text-secondary)]">{t("loading")}</p>}
          {state.status === "error" && <p role="alert" className="text-sm text-red-400">{t("error")}</p>}
          {state.status === "ready" && state.plan.deckCount === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">{t("noDecks")}</p>
          )}
          {state.status === "ready" && state.plan.deckCount > 0 && items.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">{t("complete")}</p>
          )}
          {state.status === "ready" && items.length > 0 && (
            <>
              <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                {t("summary", { count: missingCount, decks: state.plan.deckCount, cost: format.number(knownCost, { style: "currency", currency: "USD" }) })}
              </p>
              {unpricedCount > 0 && (
                <p className="mb-3 text-xs text-[var(--text-secondary)]">{t("unpriced", { count: unpricedCount })}</p>
              )}
              <ul className="max-h-80 divide-y divide-[var(--border)] overflow-y-auto">
                {items.map((item) => (
                  <li key={item.scryfallId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)]">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{item.decks.map((deck) => deck.name).join(" · ")}</p>
                    </div>
                    <span className="shrink-0 text-[var(--accent-text)]">{t("toAcquire", { count: item.acquireQuantity })}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

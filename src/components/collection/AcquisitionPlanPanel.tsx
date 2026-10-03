"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Download, RefreshCw } from "lucide-react";
import { z } from "zod";
import { formatAcquisitionCsv } from "@/lib/collection/acquisition-csv";

const planSchema = z.object({
  deckCount: z.number().int().nonnegative(),
  decks: z.array(z.object({ id: z.string(), name: z.string() })),
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
  const actions = useTranslations("collection.actions");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [deckOptions, setDeckOptions] = useState<Plan["decks"]>([]);
  const [state, setState] = useState<PlanState>({ status: "loading" });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ status: "loading" });

    async function loadPlan() {
      try {
        const url = selectedDeckId
          ? `/api/collection/acquisition-plan?deckId=${encodeURIComponent(selectedDeckId)}`
          : "/api/collection/acquisition-plan";
        const response = await fetch(url, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Acquisition plan request failed");
        const parsed = planSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid acquisition plan response");
        if (!controller.signal.aborted) {
          setDeckOptions(parsed.data.decks);
          setState({ status: "ready", plan: parsed.data });
        }
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }

    void loadPlan();
    return () => controller.abort();
  }, [open, refreshKey, selectedDeckId]);

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

  const exportCsv = () => {
    const csv = formatAcquisitionCsv(items.map((item) => ({
      scryfallId: item.scryfallId,
      name: item.name,
      quantity: item.acquireQuantity,
      price: item.price,
    })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "acquisition-plan.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

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
            <div className="flex shrink-0 items-center gap-4">
              {state.status === "ready" && items.length > 0 && (
                <button
                  type="button"
                  onClick={exportCsv}
                  aria-label={`${t("title")} CSV`}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  {actions("csv")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {state.status === "error" ? t("retry") : t("refresh")}
              </button>
            </div>
          </div>
          {deckOptions.length > 1 && (
            <label className="mb-3 inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              {t("deckFilterLabel")}
              <select
                value={selectedDeckId}
                onChange={(event) => setSelectedDeckId(event.target.value)}
                className="min-w-36 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[var(--text-primary)]"
              >
                <option value="">{t("allDecks")}</option>
                {deckOptions.map((deck) => <option key={deck.id} value={deck.id}>{deck.name}</option>)}
              </select>
            </label>
          )}
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
                    <div className="shrink-0 text-right">
                      <p className="text-[var(--accent-text)]">{t("toAcquire", { count: item.acquireQuantity })}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {item.price === null
                          ? t("unpriced", { count: item.acquireQuantity })
                          : format.number(item.price * item.acquireQuantity, { style: "currency", currency: "USD" })}
                      </p>
                    </div>
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

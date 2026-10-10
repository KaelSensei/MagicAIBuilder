"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Layers3, X } from "lucide-react";
import { z } from "zod";
import { Link } from "@/i18n/navigation";

const responseSchema = z.object({
  usages: z.array(z.object({
    deckId: z.string(),
    deckName: z.string(),
    quantity: z.number().int().positive(),
    zone: z.string(),
  })),
});

type UsageState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly usages: z.infer<typeof responseSchema>["usages"] };

interface PrintingDeckUsageProps {
  readonly scryfallId: string;
  readonly cardName: string;
  readonly compact?: boolean;
}

/** On-demand links to the player's decks using this exact card printing. */
export function PrintingDeckUsage({ scryfallId, cardName, compact = false }: PrintingDeckUsageProps) {
  const t = useTranslations("collection.usage");
  const common = useTranslations("common.actions");
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<UsageState>({ status: "loading" });

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState({ status: "loading" });

    async function load() {
      try {
        const response = await fetch(
          `/api/collection/usage?scryfallId=${encodeURIComponent(scryfallId)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Printing usage request failed");
        const parsed = responseSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid printing usage response");
        if (!controller.signal.aborted) setState({ status: "ready", usages: parsed.data.usages });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }

    void load();
    return () => controller.abort();
  }, [open, scryfallId, attempt]);

  const zoneLabel = (zone: string) => {
    if (zone === "main") return t("main");
    if (zone === "sideboard") return t("sideboard");
    if (zone === "maybeboard") return t("maybeboard");
    return zone;
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={t("title", { name: cardName })}
          className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          <Layers3 className="h-3.5 w-3.5" />
          {!compact && t("trigger")}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
          <div className="mb-2 flex items-start justify-between gap-3">
            <Dialog.Title className="text-base font-semibold text-[var(--text-primary)]">
              {t("title", { name: cardName })}
            </Dialog.Title>
            <Dialog.Close aria-label={common("close")} className="rounded p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-xs text-[var(--text-secondary)]">
            {t("description")}
          </Dialog.Description>
          {state.status === "loading" && <output className="block text-sm text-[var(--text-secondary)]">{t("loading")}</output>}
          {state.status === "error" && (
            <div role="alert" className="text-sm text-red-400">
              {t("error")}
              <button type="button" onClick={() => setAttempt((value) => value + 1)} className="ml-2 underline">{t("retry")}</button>
            </div>
          )}
          {state.status === "ready" && state.usages.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">{t("empty")}</p>
          )}
          {state.status === "ready" && state.usages.length > 0 && (
            <ul className="divide-y divide-[var(--border)]">
              {state.usages.map((usage) => (
                <li key={`${usage.deckId}-${usage.zone}`} className="py-2">
                  <Link href={`/builder/${usage.deckId}`} onClick={() => setOpen(false)} className="text-sm font-medium text-[var(--accent-text)] hover:underline">
                    {usage.deckName}
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {zoneLabel(usage.zone)} · {t("copies", { count: usage.quantity })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { useTranslations } from "next-intl";

type ReportReason = "spam" | "harassment" | "illegal_content" | "other";

interface DeckReportButtonProps {
  readonly deckId: string;
  readonly isSignedIn: boolean;
  readonly isOwner: boolean;
}

export function DeckReportButton({ deckId, isSignedIn, isOwner }: DeckReportButtonProps) {
  const t = useTranslations("deck.report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  if (!isSignedIn || isOwner) return null;

  const submit = async () => {
    setStatus("submitting");
    try {
      const response = await fetch(`/api/community/decks/${deckId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setStatus(response.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return <span className="text-xs text-green-400">{t("submitted")}</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-red-300"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        {t("action")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="report-title" className="font-semibold text-[var(--text-primary)]">{t("title")}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="mb-4 block text-sm text-[var(--text-secondary)]">
              {t("reason")}
              <select value={reason} onChange={(event) => setReason(event.target.value as ReportReason)} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)]">
                {(["spam", "harassment", "illegal_content", "other"] as const).map((value) => (
                  <option key={value} value={value}>{t(`reasons.${value}`)}</option>
                ))}
              </select>
            </label>
            {status === "error" && <p className="mb-3 text-xs text-red-300">{t("failed")}</p>}
            <button type="button" onClick={() => void submit()} disabled={status === "submitting"} className="w-full rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/25 disabled:opacity-50">
              {status === "submitting" ? t("submitting") : t("submit")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

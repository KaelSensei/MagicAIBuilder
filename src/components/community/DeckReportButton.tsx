"use client";
/**
 * The "report deck" control of a public deck page: a native modal dialog
 * where the viewer picks one reason from the shared catalog and sends the
 * report.
 *
 * Community context (UI). The report goes through the community client; a
 * sent report replaces the control with a confirmation, a rejection keeps the
 * dialog open with one failure line. The dialog wraps backward Tab inside
 * itself and gives focus back to the trigger when it closes. Hidden from
 * visitors and from the deck's owner. Not responsible for: the reasons
 * themselves (`REPORT_REASONS`, `lib/community/community-contracts.ts`) and
 * the request wire format (`lib/community/community-client.ts`).
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Flag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { reportDeck } from "@/lib/community/community-client";
import {
  isReportReason,
  REPORT_REASONS,
  type ReportReason,
} from "@/lib/community/community-contracts";

interface DeckReportButtonProps {
  readonly deckId: string;
  readonly isSignedIn: boolean;
  readonly isOwner: boolean;
}

/** Lets a signed-in viewer report someone else's public deck to a moderator. */
export function DeckReportButton({ deckId, isSignedIn, isOwner }: DeckReportButtonProps) {
  const t = useTranslations("deck.report");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = triggerRef.current;
    dialog.showModal();
    return () => {
      dialog.close();
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab" || !event.shiftKey) return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled)");
    const first = controls.item(0);
    const last = controls.item(controls.length - 1);
    if (first && last && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }
  };

  if (!isSignedIn || isOwner) return null;

  const submit = async () => {
    setStatus("submitting");
    try {
      await reportDeck(deckId, reason);
      setStatus("sent");
      setOpen(false);
    } catch {
      setStatus("error");
    }
  };

  /** The `<select>` only offers catalog reasons; anything else is ignored. */
  const chooseReason = (value: string) => {
    if (isReportReason(value)) setReason(value);
  };

  if (status === "sent") {
    return <span className="text-xs text-green-400">{t("submitted")}</span>;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-red-300"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        {t("action")}
      </button>
      {open && (
          <dialog ref={dialogRef} onKeyDown={handleDialogKeyDown} onCancel={() => setOpen(false)} aria-labelledby="report-title" className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl backdrop:bg-black/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="report-title" className="font-semibold text-[var(--text-primary)]">{t("title")}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="mb-4 block text-sm text-[var(--text-secondary)]">
              {t("reason")}
              <select value={reason} onChange={(event) => chooseReason(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)]">
                {REPORT_REASONS.map((value) => (
                  <option key={value} value={value}>{t(`reasons.${value}`)}</option>
                ))}
              </select>
            </label>
            {status === "error" && <p className="mb-3 text-xs text-red-300">{t("failed")}</p>}
            <button type="button" onClick={() => void submit()} disabled={status === "submitting"} className="w-full rounded-lg bg-red-500/15 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/25 disabled:opacity-50">
              {status === "submitting" ? t("submitting") : t("submit")}
            </button>
          </dialog>
      )}
    </>
  );
}

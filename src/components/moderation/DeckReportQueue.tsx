"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, Flag, Loader2, ShieldX, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ReportReason = "spam" | "harassment" | "illegal_content" | "other";
type ReviewStatus = "reviewed" | "dismissed";

interface DeckReport {
  readonly id: string;
  readonly reason: ReportReason;
  readonly createdAt: string;
  readonly deck: {
    readonly id: string;
    readonly name: string;
    readonly user: { readonly username: string | null };
  };
  readonly user: { readonly username: string | null };
}

function isDeckReport(value: unknown): value is DeckReport {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "reason" in value &&
    typeof value.reason === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "deck" in value &&
    typeof value.deck === "object" &&
    value.deck !== null &&
    "user" in value
  );
}

function readReports(value: unknown): readonly DeckReport[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !("reports" in value) ||
    !Array.isArray(value.reports)
  )
    return [];
  return value.reports.filter(isDeckReport);
}

/** Moderator-only queue for reviewing private reports about public decks. */
export function DeckReportQueue() {
  const t = useTranslations("deck.moderation");
  const format = useFormatter();
  const [reports, setReports] = useState<readonly DeckReport[]>([]);
  const [state, setState] = useState<
    "loading" | "ready" | "forbidden" | "error"
  >("loading");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const response = await fetch("/api/moderation/deck-reports");
      if (response.status === 403) return setState("forbidden");
      if (!response.ok) return setState("error");
      setReports(readReports(await response.json()));
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const review = async (reportId: string, status: ReviewStatus) => {
    setReviewingId(reportId);
    try {
      const response = await fetch(`/api/moderation/deck-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) return setState("error");
      setReports((current) =>
        current.filter((report) => report.id !== reportId)
      );
    } catch {
      setState("error");
    } finally {
      setReviewingId(null);
    }
  };

  if (state === "loading")
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("loading")}
      </div>
    );
  if (state === "forbidden")
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <ShieldX className="h-5 w-5 text-red-300" />
        <p>{t("forbidden")}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {state === "error" && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <span>{t("failed")}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold hover:underline"
          >
            {t("retry")}
          </button>
        </div>
      )}
      {reports.length === 0 && state === "ready" ? (
        <div className="py-16 text-center">
          <Check className="mx-auto mb-3 h-7 w-7 text-green-400" />
          <h2 className="font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {reports.map((report) => (
            <li
              key={report.id}
              className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Flag className="h-4 w-4 text-amber-300" />
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                    {t(`reasons.${report.reason}`)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {format.dateTime(new Date(report.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <Link
                  href={`/deck/${report.deck.id}`}
                  className="mt-2 inline-flex items-center gap-1 font-semibold hover:text-[var(--accent-text)]"
                >
                  {report.deck.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {t("context", {
                    owner: report.deck.user.username ?? t("unknown"),
                    reporter: report.user.username ?? t("unknown"),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={reviewingId === report.id}
                  onClick={() => void review(report.id, "dismissed")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-2 text-xs font-medium hover:bg-[var(--surface)] disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("dismiss")}
                </button>
                <button
                  type="button"
                  disabled={reviewingId === report.id}
                  onClick={() => void review(report.id, "reviewed")}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("review")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

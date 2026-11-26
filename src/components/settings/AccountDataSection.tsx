"use client";
/**
 * "Download my data" on Settings → Account: one press saves the account
 * archive as a JSON file (I-38 requirements 7.1 and 7.3, slice 5).
 *
 * The archive comes from `GET /api/user/export` only (`requestAccountArchive`);
 * this section owns the press, the busy state and the messages. The route
 * allows one export an hour, so a refusal says when the next one is possible
 * and leaves the button usable rather than reading as a failure.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { downloadTextFile } from "@/lib/download-text-file";
import { requestAccountArchive } from "./account-archive-request";

const ARCHIVE_MIME_TYPE = "application/json;charset=utf-8";

type DownloadState =
  | { readonly kind: "idle" }
  | { readonly kind: "busy" }
  | { readonly kind: "rate-limited"; readonly retryAfterSeconds: number | null }
  | { readonly kind: "failed" };

const IDLE: DownloadState = { kind: "idle" };

/** Rounds a delay up to whole minutes, never below one. */
function minutesFrom(seconds: number): number {
  return Math.max(1, Math.ceil(seconds / 60));
}

/**
 * The section that explains the account archive and downloads it.
 *
 * Renders inside the account page's `<main>`; needs the next-intl provider.
 */
export function AccountDataSection() {
  const t = useTranslations("settings.account.data");
  const [state, setState] = useState<DownloadState>(IDLE);
  const busy = state.kind === "busy";

  async function download() {
    setState({ kind: "busy" });
    const answer = await requestAccountArchive();
    if (answer.kind !== "archive") {
      setState(answer);
      return;
    }
    downloadTextFile(answer.content, answer.fileName, ARCHIVE_MIME_TYPE);
    setState(IDLE);
  }

  function start() {
    if (!busy) void download();
  }

  return (
    <section
      aria-labelledby="account-data-heading"
      className="space-y-3 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--lumen-shadow-sm)]"
    >
      <h2
        id="account-data-heading"
        className="text-base font-semibold text-[var(--text-primary)]"
      >
        {t("heading")}
      </h2>
      <p className="text-sm text-[var(--text-secondary)]">{t("contents")}</p>
      <p className="text-sm text-[var(--text-secondary)]">{t("free")}</p>

      <button
        type="button"
        onClick={start}
        disabled={busy}
        aria-busy={busy}
        className="flex items-center gap-1.5 rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-4 py-2.5 text-sm text-white shadow-[var(--lumen-shadow-sm)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {t("button")}
      </button>

      <output className="block text-sm text-[var(--text-secondary)]">
        {busy && t("busy")}
        {state.kind === "rate-limited" &&
          (state.retryAfterSeconds === null
            ? t("rateLimitedLater")
            : t("rateLimited", {
                minutes: minutesFrom(state.retryAfterSeconds),
              }))}
      </output>

      {state.kind === "failed" && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 text-sm text-red-400"
        >
          <p>{t("failed")}</p>
          <button
            type="button"
            onClick={start}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            {t("retry")}
          </button>
        </div>
      )}
    </section>
  );
}

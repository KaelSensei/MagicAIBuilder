/**
 * The public changelog of the read API (I-95).
 *
 * A presentational list. It renders the entries it is given and does not
 * fetch, and it has no deck. Chrome strings come from the `api` catalogue.
 * The summary on an entry stays the English contract text.
 *
 * @module components/api/ApiChangelogView
 */
"use client";

import { useTranslations } from "next-intl";
import type { ApiChangelogEntry, ApiChangeLabel } from "@/lib/api/api-changelog";

/**
 * The catalogue word for a change label.
 *
 * Compatible and breaking are the only labels. The word is text, not a colour.
 *
 * @param label - The entry's label.
 * @param compatible - The catalogue string for a compatible change.
 * @param breaking - The catalogue string for a breaking change.
 * @returns The word to show beside the date.
 */
function changeLabel(label: ApiChangeLabel, compatible: string, breaking: string): string {
  switch (label) {
    case "compatible":
      return compatible;
    case "breaking":
      return breaking;
    default: {
      const unreachable: never = label;
      return unreachable;
    }
  }
}

/**
 * The dated changes a visitor reads at `/api-changelog`.
 *
 * @param props.entries - The changelog. Empty is a sentence, not a blank page.
 *   Each route is shown as stored. A route outside `/api/v1` never reaches
 *   this list: `checkApiChangelog` refuses it.
 */
export function ApiChangelogView({ entries }: { readonly entries: readonly ApiChangelogEntry[] }) {
  const t = useTranslations("api");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("title")}</h1>
      <p className="text-sm text-[var(--text-secondary)]">{t("description")}</p>
      {entries.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {entries.map((entry) => (
            <li
              key={`${entry.date}-${entry.documentHash}`}
              className="flex flex-col gap-2 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] p-4"
            >
              <p className="text-sm text-[var(--text-secondary)]">{t("date", { date: entry.date })}</p>
              <p className="text-sm font-medium">
                {changeLabel(entry.label, t("compatible"), t("breaking"))}
              </p>
              <p>{entry.summary}</p>
              {entry.field !== null && entry.field.trim() !== "" ? (
                <p>{t("field", { field: entry.field })}</p>
              ) : null}
              <h2 className="text-sm font-semibold">{t("routes")}</h2>
              <ul className="flex flex-col gap-1">
                {entry.routes.map((route) => (
                  <li key={route}>
                    <code>{route}</code>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

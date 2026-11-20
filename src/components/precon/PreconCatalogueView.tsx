"use client";

/**
 * The read-only precon catalogue (I-17 slice 1).
 *
 * Shows each stored version: set, commander id, release day, source and
 * card count. There is no edit, no bundle and no price. An empty catalogue
 * says the lists have not been loaded; I-67 slice 13 brings the first set.
 *
 * @module precon/PreconCatalogueView
 */
import { useTranslations } from "next-intl";
import type { Catalogue, PreconVersion } from "@/lib/precon/catalogue";

interface PreconCatalogueViewProps {
  /** The versions to show, in the order they were recorded. */
  readonly catalogue: Catalogue;
}

/** The signed-out catalogue page's list. */
export function PreconCatalogueView({ catalogue }: PreconCatalogueViewProps) {
  const t = useTranslations("precon");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {t("readOnly")}
      </p>
      {catalogue.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--text-secondary)]">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {catalogue.map((version) => (
            <li key={`${version.id}:${version.version}`}>
              <PreconVersionArticle version={version} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

/** One stored version. No controls that would change it. */
function PreconVersionArticle({
  version,
}: {
  readonly version: PreconVersion;
}) {
  const t = useTranslations("precon");
  const copies = version.cards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        {version.name}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {t("set", { set: version.setCode })}
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        {t("released", { date: version.releaseDate })}
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        {t("version", { version: version.version })}
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        {t("cards", { count: copies })}
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        {t("sourceRead", { date: version.sourceReadAt })}
      </p>
      <a
        className="mt-2 inline-block text-sm text-[var(--accent-text)] underline"
        href={version.sourceUrl}
        rel="noreferrer"
      >
        {t("source")}
      </a>
    </article>
  );
}

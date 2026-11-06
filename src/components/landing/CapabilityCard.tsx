"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** One confirmed Commander workflow shown on the landing atlas. */
export interface CapabilityEntry {
  readonly index: string;
  readonly title: string;
  readonly description: string;
  readonly detail: string;
  readonly primaryAction: string;
  readonly primaryHref: string;
  readonly secondaryAction?: string;
  readonly secondaryHref?: string;
  readonly icon: ReactNode;
}

const ACTION_CLASS =
  "text-sm font-medium text-[var(--accent-text)] underline decoration-[var(--accent-soft)] underline-offset-4 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-sm";

/**
 * Raised card for one landing capability.
 *
 * @param entry - copy, destinations, and icon for the workflow
 * @returns the list item
 */
export function CapabilityCard({ entry }: { readonly entry: CapabilityEntry }) {
  return (
    <li className="flex h-full flex-col rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--lumen-shadow-sm)]">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--lumen-radius-lg)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
        {entry.icon}
      </span>
      <p className="sr-only">{entry.index}</p>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{entry.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{entry.description}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-secondary)]">{entry.detail}</p>
      <div className="mt-4 flex flex-col items-start gap-2">
        <Link href={entry.primaryHref} className={ACTION_CLASS}>
          {entry.primaryAction}
        </Link>
        {entry.secondaryAction && entry.secondaryHref ? (
          <Link href={entry.secondaryHref} className={ACTION_CLASS}>
            {entry.secondaryAction}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

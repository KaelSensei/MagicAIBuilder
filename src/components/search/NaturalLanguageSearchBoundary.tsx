"use client";

import { Component, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { logger } from "@/lib/logger";

interface BoundaryState {
  readonly failed: boolean;
}

/**
 * Keeps a natural-language search failure from taking down the deck editor.
 * Syntax search stays mounted outside this boundary.
 */
export class NaturalLanguageSearchBoundary extends Component<
  { readonly children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    logger.error(
      error instanceof Error ? error.message : "Natural-language search failed",
      "NaturalLanguageSearch"
    );
  }

  render(): ReactNode {
    if (this.state.failed) return <NaturalLanguageSearchCrash />;
    return this.props.children;
  }
}

function NaturalLanguageSearchCrash() {
  const t = useTranslations("search");
  return (
    <p role="alert" className="text-xs text-[var(--text-secondary)]">
      {t("naturalLanguage.failed")}
    </p>
  );
}

"use client";

/**
 * One previewed card of a card package: its checkbox, its translated status
 * and, when the preview blocks it, each reason in the player's language.
 *
 * The checkbox's name is the card plus its status; the reasons are its
 * description (`aria-describedby`), so a screen reader says why only for a
 * blocked card, from the same text a sighted player reads.
 *
 * @module components/deck/CardPackagePreviewRow
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import type {
  PreviewCardAnswer,
  PreviewIssueKind,
} from "@/lib/community/card-package-answers";

/**
 * The catalog key of each reason. The `Record` makes it exhaustive: a new
 * kind does not compile until it has words.
 */
const ISSUE_MESSAGE_KEYS: Readonly<Record<PreviewIssueKind, string>> = {
  // On the format's banned list (CR 100.6: tournament rules set the lists).
  banned: "issues.banned",
  // CR 903.5c: every color of the card must be in the commander's identity.
  colorIdentity: "issues.colorIdentity",
  // CR 903.5b: other than basic lands, one card of each English name.
  singleton: "issues.singleton",
  // CR 100.2a: at most four of a card other than basic lands, unless it says otherwise.
  copyLimit: "issues.copyLimit",
  unknown: "issues.unknown",
};

interface CardPackagePreviewRowProps {
  readonly card: PreviewCardAnswer;
  readonly selected: boolean;
  readonly onToggle: (scryfallId: string) => void;
}

/** A previewed card the player keeps or leaves out; a blocked card cannot be kept. */
export function CardPackagePreviewRow({
  card,
  selected,
  onToggle,
}: CardPackagePreviewRowProps) {
  const t = useTranslations("deck.cardPackages");
  const reasonsId = useId();
  const blocked = card.status === "blocked";
  const hasReasons = blocked && card.issueKinds.length > 0;

  return (
    <label className="flex items-start gap-2 text-xs">
      <input
        type="checkbox"
        aria-label={t("cardLabel", { name: card.name, status: t(card.status) })}
        aria-describedby={hasReasons ? reasonsId : undefined}
        disabled={blocked}
        checked={selected}
        onChange={() => onToggle(card.scryfallId)}
      />
      <span className="flex-1">
        {card.name}{" "}
        <span className={blocked ? "text-amber-400" : "text-emerald-400"}>
          · {t(card.status)}
        </span>
        {hasReasons && (
          <span
            id={reasonsId}
            className="block text-[10px] text-[var(--text-secondary)]"
          >
            {card.issueKinds.map((kind) => (
              <span key={kind} className="block">
                {t(ISSUE_MESSAGE_KEYS[kind])}
              </span>
            ))}
          </span>
        )}
      </span>
    </label>
  );
}

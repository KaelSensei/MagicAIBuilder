"use client";

import { useCallback, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import { logger } from "@/lib/logger";
import type { VoteValue } from "@/lib/community/votes";

interface VoteButtonsProps {
  readonly deckId: string;
  readonly score: number;
  readonly viewerVote: VoteValue | null;
  /** False for anonymous visitors — the buttons render but prompt to sign in */
  readonly canVote: boolean;
  readonly className?: string;
}

interface TallyResponse {
  readonly score: number;
  readonly viewerVote: VoteValue | null;
}

/**
 * Up/down vote control for a public deck.
 *
 * Clicking the direction already cast clears the vote, which is how every
 * familiar voting UI behaves and avoids needing a separate "remove" affordance.
 */
export function VoteButtons({
  deckId,
  score,
  viewerVote,
  canVote,
  className,
}: VoteButtonsProps) {
  const t = useTranslations("deck.community");
  const [tally, setTally] = useState({ score, viewerVote });
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (value: VoteValue) => {
      if (!canVote || isPending) return;
      setIsPending(true);

      const clearing = tally.viewerVote === value;

      try {
        const response = await fetch(`/api/community/decks/${deckId}/vote`, {
          method: clearing ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: clearing ? undefined : JSON.stringify({ value }),
        });

        if (!response.ok) {
          logger.warn(`vote failed: ${response.status}`, "VoteButtons");
          return;
        }

        const next = (await response.json()) as TallyResponse;
        setTally({ score: next.score, viewerVote: next.viewerVote });
      } catch (error) {
        logger.error("Unexpected error", "VoteButtons", error);
      } finally {
        setIsPending(false);
      }
    },
    [canVote, deckId, isPending, tally.viewerVote]
  );

  const title = canVote ? undefined : t("signInToVote");

  return (
    <div
      className={cn("flex flex-col items-center gap-0.5", className)}
      title={title}
    >
      <button
        type="button"
        onClick={() => submit(1)}
        disabled={!canVote || isPending}
        aria-label={t("upvote")}
        aria-pressed={tally.viewerVote === 1}
        className={cn(
          "p-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          tally.viewerVote === 1
            ? "text-green-400 bg-green-500/10"
            : "text-[var(--text-secondary)] hover:text-green-400"
        )}
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tally.score > 0 && "text-green-400",
          tally.score < 0 && "text-red-400",
          tally.score === 0 && "text-[var(--text-secondary)]"
        )}
      >
        {tally.score}
      </span>

      <button
        type="button"
        onClick={() => submit(-1)}
        disabled={!canVote || isPending}
        aria-label={t("downvote")}
        aria-pressed={tally.viewerVote === -1}
        className={cn(
          "p-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          tally.viewerVote === -1
            ? "text-red-400 bg-red-500/10"
            : "text-[var(--text-secondary)] hover:text-red-400"
        )}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

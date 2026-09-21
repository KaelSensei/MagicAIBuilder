"use client";

import { useCallback, useState } from "react";
import { CopyPlus, Printer, Share2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { forkPublicDeck } from "@/lib/db/deck-api";

interface ForkAttribution {
  readonly id: string;
  readonly name: string;
  readonly author: string | null;
}

interface PublicDeckActionsProps {
  readonly deckId: string;
  readonly deckName: string;
  readonly isSignedIn: boolean;
  readonly forkedFrom?: ForkAttribution;
}

/** Actions that preserve ownership boundaries on a public deck page. */
export function PublicDeckActions({
  deckId,
  deckName,
  isSignedIn,
  forkedFrom,
}: PublicDeckActionsProps) {
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const [shared, setShared] = useState(false);

  const handleFork = useCallback(async () => {
    if (!isSignedIn || forking) return;
    setForking(true);
    try {
      const fork = await forkPublicDeck(deckId);
      router.push(`/builder/${fork.id}`);
    } finally {
      setForking(false);
    }
  }, [deckId, forking, isSignedIn, router]);

  const handleShare = useCallback(async () => {
    const shareData = { title: deckName, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(shareData.url);
    setShared(true);
  }, [deckName]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forkedFrom && (
        <span className="mr-auto text-xs text-[var(--text-secondary)]">
          Forked from{" "}
          <a
            href={`/deck/${forkedFrom.id}`}
            className="font-medium text-[var(--accent-text)] hover:underline"
          >
            {forkedFrom.name}
            {forkedFrom.author ? ` by ${forkedFrom.author}` : ""}
          </a>
        </span>
      )}
      {!forkedFrom && <span className="mr-auto" />}
      <button
        type="button"
        onClick={() => void handleFork()}
        disabled={!isSignedIn || forking}
        aria-label={forking ? "Forking deck" : "Fork deck"}
        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CopyPlus className="h-3.5 w-3.5" />
        {forking ? "Forking…" : "Fork"}
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label={shared ? "Deck shared" : "Share deck"}
        className="rounded-md border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        aria-label="Print guide"
        className="rounded-md border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Printer className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

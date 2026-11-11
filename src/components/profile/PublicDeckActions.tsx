"use client";

import { useCallback, useState } from "react";
import { Bookmark, CopyPlus, Printer, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("deck");
  const router = useRouter();
  const [forking, setForking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
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

  const handleSave = useCallback(async () => {
    if (!isSignedIn || saving || saved) return;
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch("/api/community/decks/" + deckId + "/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: null }),
      });
      if (response.ok) setSaved(true);
      else setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [deckId, isSignedIn, saved, saving]);

  const handleShare = useCallback(async () => {
    const shareData = { title: deckName, url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(shareData.url);
    setShared(true);
  }, [deckName]);

  let saveLabel = t("savedFolders.save");
  let saveAccessibleLabel = t("public.saveDeck");
  if (saved) {
    saveLabel = t("savedFolders.saved");
    saveAccessibleLabel = t("public.savedDeck");
  } else if (saving) {
    saveLabel = t("savedFolders.saving");
    saveAccessibleLabel = t("public.savingDeck");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forkedFrom && (
        <span className="mr-auto text-xs text-[var(--text-secondary)]">
          {t.rich("public.forkedFrom", {
            source: forkedFrom.author
              ? t("public.forkSource", {
                  name: forkedFrom.name,
                  author: forkedFrom.author,
                })
              : forkedFrom.name,
            link: (chunks) => (
              <a
                href={`/deck/${forkedFrom.id}`}
                className="font-medium text-[var(--accent-text)] hover:underline"
              >
                {chunks}
              </a>
            ),
          })}
        </span>
      )}
      {!forkedFrom && <span className="mr-auto" />}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!isSignedIn || saving || saved}
        aria-label={saveAccessibleLabel}
        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Bookmark className="h-3.5 w-3.5" fill={saved ? "currentColor" : "none"} />
        {saveLabel}
      </button>
      {saveError && (
        <p role="alert" className="text-xs text-red-400">
          {t("public.saveFailed")}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleFork()}
        disabled={!isSignedIn || forking}
        aria-label={forking ? t("public.forkingDeck") : t("public.forkDeck")}
        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CopyPlus className="h-3.5 w-3.5" />
        {forking ? t("public.forking") : t("public.fork")}
      </button>
      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label={shared ? t("public.deckShared") : t("share.openShare")}
        className="rounded-md border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        aria-label={t("public.printGuide")}
        className="rounded-md border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <Printer className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

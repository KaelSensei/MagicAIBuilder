"use client";
// Public read-only deck page — accessible without auth for public decks
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { User, ExternalLink, Link2, Check } from "lucide-react";
import type { PublicDeck } from "@/lib/deck/public-deck";
import { DeckRatingPanel } from "@/components/community/DeckRatingPanel";
import { DeckCommentPanel } from "@/components/community/DeckCommentPanel";
import { PublicDeckPrimer } from "./PublicDeckPrimer";
import { PublicDeckActions } from "./PublicDeckActions";
import { FocusedFeedbackPanel } from "@/components/community/FocusedFeedbackPanel";
import { DeckReportButton } from "@/components/community/DeckReportButton";
import { SavePublicDeckButton } from "@/components/community/SavePublicDeckButton";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
import { PublicDeckCards } from "./PublicDeckCards";
import { DataAsOfLine } from "@/components/deck/DataAsOfLine";
import { currentDataAsOfFacts } from "@/lib/deck/data-as-of";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";

interface PublicDeckViewProps {
  readonly deck: PublicDeck;
  /** Anonymous viewers see the aggregate but cannot rate. */
  readonly isSignedIn: boolean;
}

const BRACKET_COLORS: Record<number, string> = {
  1: "text-green-400 border-green-400/30 bg-green-400/10",
  2: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  3: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  4: "text-red-400 border-red-400/30 bg-red-400/10",
  5: "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10",
};

export function PublicDeckView({ deck, isSignedIn }: PublicDeckViewProps) {
  const t = useTranslations("deck");
  const [copied, setCopied] = useState(false);
  const commander = deck.cards.find((c) => c.isCommander && !c.isPartner);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const partner = deck.cards.find((c) => c.isPartner);
  const nonCommanderCards = deck.cards.filter(
    (c) => !c.isCommander && !c.isPartner
  );
  const authorName =
    deck.user?.name ?? deck.user?.username ?? t("community.anonymous");
  const authorUsername = deck.user?.username;
  const totalCards = deck.cards.reduce((s, c) => s + c.quantity, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className={cn(cardSurfaceClassName, "flex flex-col gap-4 p-5 md:flex-row md:p-6")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {deck.name}
            </h1>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline"
              >
                {copied ? (
                  <Check
                    className="w-3.5 h-3.5 text-green-400"
                    aria-hidden="true"
                  />
                ) : (
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {copied ? t("share.copiedLink") : t("share.copyLink")}
              </button>
              {deck.isOwner && (
                <Link
                  href={`/builder/${deck.id}`}
                  className="flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("share.editDeck")}
                </Link>
              )}
              <DeckReportButton
                deckId={deck.id}
                isSignedIn={isSignedIn}
                isOwner={deck.isOwner}
              />
              <SavePublicDeckButton
                deckId={deck.id}
                isSignedIn={isSignedIn}
                isOwner={deck.isOwner}
              />
            </div>
          </div>

          {/* Commander info */}
          {commander && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {commander.name}
              {partner && ` + ${partner.name}`}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span
              className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BRACKET_COLORS[deck.targetBracket] ?? ""}`}
            >
              {t("public.bracket", { bracket: deck.targetBracket })}
            </span>
            <span className="text-xs text-[var(--text-secondary)] capitalize">
              {deck.format}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {t("share.cardCountLabel", { count: totalCards })}
            </span>
            {deck.isAIGenerated && (
              <span className="text-xs text-purple-400">
                <span aria-hidden="true">✦ </span>
                {t("public.aiGenerated")}
              </span>
            )}
          </div>

          <DataAsOfLine facts={currentDataAsOfFacts()} />

          {/* Author */}
          <div className="flex items-center gap-2 mt-3">
            {deck.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={deck.user.image}
                alt={authorName}
                className="w-5 h-5 rounded-full border border-[var(--border)]"
              />
            ) : (
              <User className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
            {authorUsername ? (
              <Link
                href={`/u/${authorUsername}`}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-text)] transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-xs text-[var(--text-secondary)]">
                {authorName}
              </span>
            )}
          </div>
        </div>
        {commander?.imageUri ? (
          <Image
            src={normalizeScryfallImageUrl(commander.imageUri)}
            alt={commander.name}
            width={160}
            height={223}
            unoptimized
            className="h-auto w-28 shrink-0 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] shadow-[var(--lumen-shadow-sm)] md:w-36"
          />
        ) : null}
      </div>

      {deck.description?.trim() && (
        <PublicDeckPrimer
          description={deck.description}
          labels={{
            contents: t("description.primerContents"),
            copy: t("description.copyPrimer"),
            copied: t("description.primerCopied"),
            download: t("description.downloadPrimer"),
          }}
        />
      )}

      <PublicDeckActions
        deckId={deck.id}
        deckName={deck.name}
        isSignedIn={isSignedIn}
        forkedFrom={
          deck.forkedFromDeckId && deck.forkedFromDeckName
            ? {
                id: deck.forkedFromDeckId,
                name: deck.forkedFromDeckName,
                author: deck.forkedFromUserName ?? null,
              }
            : undefined
        }
      />

      <FocusedFeedbackPanel
        deckId={deck.id}
        isOwner={deck.isOwner}
        initialEnabled={deck.seekingFeedback ?? false}
        initialQuestion={deck.feedbackQuestion ?? ""}
        labels={{
          title: t("feedback.title"),
          ownerHint: t("feedback.ownerHint"),
          enable: t("feedback.enable"),
          placeholder: t("feedback.placeholder"),
          save: t("feedback.save"),
          saving: t("feedback.saving"),
          error: t("feedback.error"),
        }}
      />

      {/* Community rating */}
      <DeckRatingPanel
        deckId={deck.id}
        isOwner={deck.isOwner}
        isSignedIn={isSignedIn}
      />

      {/* Comment stream */}
      <DeckCommentPanel
        deckId={deck.id}
        isOwner={deck.isOwner}
        isSignedIn={isSignedIn}
      />

      <PublicDeckCards cards={nonCommanderCards} />
    </main>
  );
}

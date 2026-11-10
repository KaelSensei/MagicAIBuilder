"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Archive, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import {
  useGuestDeckClaim,
  type GuestDeckClaimState,
} from "@/hooks/useGuestDeckClaim";

/** Floating sits over any page; inline sits in the deck list's flow. */
export type GuestDeckClaimPlacement = "floating" | "inline";

interface GuestDeckClaimOfferProps {
  readonly placement: GuestDeckClaimPlacement;
  /** Called with the new deck's id once the account holds it. */
  readonly onSaved?: (deckId: string) => void;
}

const PLACEMENT_CLASSES: Readonly<Record<GuestDeckClaimPlacement, string>> = {
  // Below z-40 so an open dialog's overlay still covers it.
  floating:
    "fixed inset-x-4 bottom-4 z-30 shadow-[var(--lumen-shadow-lg)] sm:right-auto sm:w-96",
  inline: "mb-6",
};

type OpenOffer = Extract<GuestDeckClaimState, { readonly deck: unknown }>;

interface OfferBodyProps {
  readonly titleId: string;
  readonly offer: OpenOffer;
  readonly onAccept: () => void;
  readonly onDecline: () => void;
}

function OfferBody({ titleId, offer, onAccept, onDecline }: OfferBodyProps) {
  const t = useTranslations("deck.guestClaim");
  const isSaving = offer.kind === "saving";
  const acceptLabel = {
    offered: t("accept"),
    saving: t("saving"),
    failed: t("retry"),
  }[offer.kind];

  return (
    <>
      <h2
        id={titleId}
        className="text-sm font-semibold text-[var(--text-primary)]"
      >
        {t("title")}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {t("description", {
          name: offer.deck.name,
          count: offer.deck.cardCount,
        })}
      </p>
      {offer.kind === "failed" && (
        <p role="alert" className="mt-2 text-sm text-[var(--text-primary)]">
          {t("failed")}
        </p>
      )}
      {/* Same variant and size for both: declining must not look lesser. */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onAccept}
          disabled={isSaving}
        >
          {acceptLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDecline}
          disabled={isSaving}
        >
          {t("decline")}
        </Button>
      </div>
    </>
  );
}

interface SavedBodyProps {
  readonly deckId: string;
  readonly deckName: string;
  readonly onClose: () => void;
}

function SavedBody({ deckId, deckName, onClose }: SavedBodyProps) {
  const t = useTranslations("deck.guestClaim");

  return (
    <div className="flex items-start gap-3">
      <p
        role="status"
        className="min-w-0 flex-1 text-sm text-[var(--text-primary)]"
      >
        {t("saved", { name: deckName })}{" "}
        <Link
          href={`/builder/${deckId}`}
          className="font-medium text-[var(--accent-text)] underline"
        >
          {t("open")}
        </Link>
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label={t("close")}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

/**
 * Offers a signed-in user to save the guest deck this browser still holds.
 *
 * Floating, it appears once per guest deck on any page; inline, on the deck
 * list, it stays available after the user declined.
 *
 * @param props - placement, and what to do once the deck is saved
 * @returns the offer, or nothing when there is no guest deck to save
 */
export function GuestDeckClaimOffer({
  placement,
  onSaved,
}: GuestDeckClaimOfferProps) {
  const titleId = useId();
  const { state, accept, decline, dismiss } = useGuestDeckClaim({
    includeDeclined: placement === "inline",
    onSaved,
  });

  if (state.kind === "hidden") return null;

  return (
    <section
      aria-labelledby={state.kind === "saved" ? undefined : titleId}
      aria-live="polite"
      className={cn(
        "flex gap-3 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4",
        PLACEMENT_CLASSES[placement]
      )}
    >
      <Archive
        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        {state.kind === "saved" ? (
          <SavedBody
            deckId={state.deckId}
            deckName={state.deckName}
            onClose={dismiss}
          />
        ) : (
          <OfferBody
            titleId={titleId}
            offer={state}
            onAccept={() => void accept()}
            onDecline={decline}
          />
        )}
      </div>
    </section>
  );
}

"use client";
/**
 * Share popover: the owner's control over a deck's share link, mounted in the
 * builder's deck action row.
 *
 * The "Share" pill opens a non-modal dialog where the owner switches the link
 * on, copies it and revokes it (`useShareLink`). Dropped from the action row
 * by 7ce381b4 without a stated reason; mounted again under OD-01 (2026-11-10).
 */
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useShareLink } from "@/hooks/useShareLink";
import { SharePopoverPanel } from "./SharePopoverPanel";

interface SharePopoverProps {
  readonly deckId: string;
  /** Whether the deck already has a live share link, as `GET /api/decks/[id]` reports it. */
  readonly initialShareEnabled: boolean;
  /** Classes for the trigger's text label, e.g. to hide it on narrow screens. */
  readonly labelClassName?: string;
}

/** Closes the popover on Escape and on a pointer press outside `ref`. */
function useCloseOnOutsideOrEscape(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void
): void {
  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      if (
        e.target instanceof Node &&
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        close();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, ref, close]);
}

/**
 * The "Share" pill of the deck action row and its popover.
 *
 * The trigger is named "Share" for assistive technology whatever its label
 * shows, and a "Public" badge describes it while a link is live. Opening the
 * popover on an already-shared deck recovers the link's URL, which the owner's
 * deck does not carry.
 */
export function SharePopover({
  deckId,
  initialShareEnabled,
  labelClassName,
}: SharePopoverProps) {
  const t = useTranslations("deck");
  const dialogId = useId();
  const badgeId = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const link = useShareLink(deckId, initialShareEnabled);
  useCloseOnOutsideOrEscape(ref, open, () => setOpen(false));

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && link.isEnabled && link.shareUrl === null) void link.enable();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={t("share.share")}
        aria-describedby={link.isEnabled ? badgeId : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        title={t("share.openShare")}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-all md:px-3",
          link.isEnabled
            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-text)]"
            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        )}
      >
        <Share2 className="w-3 h-3" />
        <span className={labelClassName}>{t("share.share")}</span>
        {link.isEnabled && (
          <span
            id={badgeId}
            className="ml-0.5 rounded-full bg-[var(--accent)] px-1 py-0 text-[10px] font-semibold leading-none text-white"
          >
            {t("share.public")}
          </span>
        )}
      </button>

      {open && (
        <SharePopoverPanel
          id={dialogId}
          link={link}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

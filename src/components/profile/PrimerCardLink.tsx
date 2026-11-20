"use client";
/**
 * A resolved `[[Card Name]]` mention: a link to the deck card's Scryfall page, with a preview of
 * the card that opens on hover and on keyboard focus.
 *
 * Community context, mounted by `PrimerBlocks` for a mention that `resolvePrimerCard` matched.
 * WCAG 1.4.13 (content on hover or focus,
 * https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus, read 2026-11-20) asks
 * such content to be dismissible, hoverable and persistent:
 * - Escape closes the preview without moving the pointer or focus. The preview is the topmost
 *   layer, so it takes that Escape for itself: the primer editor's dialog, which drops the draft
 *   on Escape, never sees it.
 * - The preview is a child of the element that tracks the pointer, so moving the pointer from the
 *   link onto it keeps it open. It stays until the pointer leaves, focus leaves or Escape.
 * - It is fixed to the viewport, below the link or above it near the bottom edge, so a scrolling
 *   pane such as the editor preview does not clip it. It is not portalled: a portal out of the
 *   editor's dialog would sit outside its pointer and focus boundary.
 * Not responsible for: resolving the name, or links the author wrote (`PrimerBlocks`).
 *
 * @module profile/PrimerCardLink
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import type { PrimerCardTarget } from "@/lib/community/primer-card-links";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";

/** The preview's size: a card image at 146 × 204 (Scryfall's 488 × 680 ratio), plus its name. */
const PREVIEW_WIDTH = 162;
const PREVIEW_HEIGHT = 240;
const VIEWPORT_MARGIN = 8;

interface PreviewPosition {
  readonly left: number;
  readonly top: number;
}

/** Below the link, or above it when the viewport has no room below; never past either side. */
function previewPosition(anchor: DOMRect): PreviewPosition {
  const maxLeft = globalThis.innerWidth - PREVIEW_WIDTH - VIEWPORT_MARGIN;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, maxLeft));
  const fitsBelow =
    anchor.bottom + PREVIEW_HEIGHT <= globalThis.innerHeight - VIEWPORT_MARGIN;
  const top = fitsBelow
    ? anchor.bottom
    : Math.max(VIEWPORT_MARGIN, anchor.top - PREVIEW_HEIGHT);
  return { left, top };
}

/**
 * Closes the open preview on Escape. It listens on the window in the capture phase, ahead of the
 * document-level capture listener a Radix dialog uses, and stops the key there.
 *
 * @param isOpen - whether the preview is open; it listens only then
 * @param close - closes the preview
 */
function useEscapeToClose(isOpen: boolean, close: () => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close();
    };
    globalThis.addEventListener("keydown", closeOnEscape, { capture: true });
    return () =>
      globalThis.removeEventListener("keydown", closeOnEscape, {
        capture: true,
      });
  }, [isOpen, close]);
}

/** The card's image and name, fixed beside the link. */
function CardPreview({
  target,
  position,
}: {
  readonly target: PrimerCardTarget;
  readonly position: PreviewPosition;
}): ReactNode {
  return (
    <span
      role="tooltip"
      className="fixed z-9999 flex flex-col items-center gap-1 rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--lumen-shadow-lg)]"
      style={{ left: position.left, top: position.top, width: PREVIEW_WIDTH }}
    >
      {target.imageUri ? (
        <Image
          src={normalizeScryfallImageUrl(target.imageUri)}
          alt={target.name}
          width={146}
          height={204}
          unoptimized
          className="rounded-md"
        />
      ) : null}
      <span className="text-xs font-medium text-[var(--text-primary)]">
        {target.name}
      </span>
    </span>
  );
}

/**
 * A link to a deck card's Scryfall page, opened like the primer's other external links, whose
 * accessible name is the card's name.
 *
 * @param target - the resolved deck card
 * @param linkClassName - the primer's link style
 * @param rel - the primer's `rel` for links to another site
 */
export function PrimerCardLink({
  target,
  linkClassName,
  rel,
}: {
  readonly target: PrimerCardTarget;
  readonly linkClassName: string;
  readonly rel: string;
}): ReactNode {
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState<PreviewPosition | null>(null);

  const open = useCallback(() => {
    const anchor = anchorRef.current;
    if (anchor) setPosition(previewPosition(anchor.getBoundingClientRect()));
  }, []);
  const close = useCallback(() => setPosition(null), []);
  useEscapeToClose(position !== null, close);

  return (
    <span onMouseEnter={open} onMouseLeave={close}>
      <a
        ref={anchorRef}
        href={target.href}
        target="_blank"
        rel={rel}
        className={linkClassName}
        onFocus={open}
        onBlur={close}
      >
        {target.name}
      </a>
      {position ? <CardPreview target={target} position={position} /> : null}
    </span>
  );
}

"use client";
/**
 * The panel of the share popover: the sharing switch and, once a link is live,
 * the link itself with its copy button. Owns no state beyond the clipboard
 * flag; `SharePopover` drives it with `useShareLink`.
 */
import { useTranslations } from "next-intl";
import { Copy, Check, Globe, Lock, Loader2, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { ShareLinkState } from "@/hooks/useShareLink";

interface SharePopoverPanelProps {
  /** The dialog's element id, which the trigger's `aria-controls` names. */
  readonly id: string;
  readonly link: ShareLinkState;
  readonly onClose: () => void;
}

/** The link row: the URL, selected on focus, and a copy button that announces the copy. */
function ShareLinkRow({ shareUrl }: { readonly shareUrl: string }) {
  const t = useTranslations("deck");
  const [copied, copy] = useCopyToClipboard();

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-secondary)]">
        {t("share.anyoneCanView")}
      </p>
      <div className="flex items-center gap-1.5">
        <input
          readOnly
          value={shareUrl}
          aria-label={t("share.linkLabel")}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 truncate rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-xs text-[var(--text-secondary)] outline-none"
        />
        <button
          type="button"
          onClick={() => void copy(shareUrl)}
          aria-label={copied ? t("share.copiedLink") : t("share.copyLink")}
          title={t("share.copyLink")}
          className="shrink-0 rounded border border-[var(--border)] p-1.5 text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * A non-modal dialog named "Share deck", drawn under the trigger.
 *
 * It is a native `<dialog open>`: the element carries the dialog role itself,
 * and `SharePopover` keeps the closing (Escape, a press outside) and the
 * anchoring, which a modal `showModal()` would take over. The user-agent
 * stylesheet centres a dialog in its containing block and caps its size to
 * that block, so the classes reset the left edge, the margins and the caps.
 *
 * The switch is named for the action it performs next ("Enable sharing" /
 * "Disable sharing") and is disabled while a request is in flight.
 */
export function SharePopoverPanel({
  id,
  link,
  onClose,
}: SharePopoverPanelProps) {
  const t = useTranslations("deck");
  const tCommon = useTranslations("common");
  const { isEnabled, shareUrl, loading } = link;

  return (
    <dialog
      open
      id={id}
      aria-label={t("share.title")}
      className="absolute left-auto right-0 top-full z-50 m-0 mt-2 w-72 max-w-none max-h-none rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--text-primary)] shadow-[var(--lumen-shadow-md)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("share.title")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={tCommon("actions.close")}
          className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <Globe className="w-4 h-4 text-[var(--accent-text)]" />
          ) : (
            <Lock className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
          <span className="text-sm text-[var(--text-primary)]">
            {isEnabled ? t("share.publicLinkActive") : t("share.private")}
          </span>
        </div>
        <button
          type="button"
          onClick={isEnabled ? link.revoke : link.enable}
          disabled={loading}
          role="switch"
          aria-checked={isEnabled}
          aria-label={
            isEnabled ? t("share.disableSharing") : t("share.enableSharing")
          }
          className={cn(
            "relative h-5 w-10 shrink-0 rounded-full transition-colors duration-200",
            isEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]",
            loading && "cursor-not-allowed opacity-60"
          )}
        >
          {loading ? (
            <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
          ) : (
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
                isEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          )}
        </button>
      </div>

      {isEnabled && shareUrl !== null && <ShareLinkRow shareUrl={shareUrl} />}
      {!isEnabled && (
        <p className="text-xs text-[var(--text-secondary)]">
          {t("share.enableToGenerate")}
        </p>
      )}
    </dialog>
  );
}

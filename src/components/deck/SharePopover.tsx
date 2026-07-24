"use client";
// Share popover — toggle sharing on/off, copy link to clipboard
import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Share2, Copy, Check, Globe, Lock, Loader2, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { logger } from "@/lib/logger";

interface SharePopoverProps {
  readonly deckId: string;
}

export function SharePopover({ deckId }: SharePopoverProps) {
  const t = useTranslations("deck");
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, copy] = useCopyToClipboard();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isEnabled) {
        // Disable sharing
        const res = await fetch(`/api/decks/${deckId}/share`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsEnabled(false);
          setShareUrl(null);
        }
      } else {
        // Enable sharing
        const res = await fetch(`/api/decks/${deckId}/share`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setIsEnabled(true);
          setShareUrl(data.shareUrl);
        }
      }
    } catch (err) {
      logger.error("Toggle error", "SharePopover", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await copy(shareUrl);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-all",
          isEnabled
            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        )}
        title="Share deck"
      >
        <Share2 className="w-3 h-3" />
        {t("share.share")}
        {isEnabled && (
          <span className="ml-0.5 px-1 py-0 rounded-full text-[10px] font-semibold bg-[var(--accent)] text-white leading-none">
            {t("share.public")}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-50 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {t("share.title")}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isEnabled ? (
                <Globe className="w-4 h-4 text-[var(--accent)]" />
              ) : (
                <Lock className="w-4 h-4 text-[var(--text-secondary)]" />
              )}
              <span className="text-sm text-[var(--text-primary)]">
                {isEnabled ? t("share.publicLinkActive") : t("share.private")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0",
                isEnabled ? "bg-[var(--accent)]" : "bg-[var(--border)]",
                loading && "opacity-60 cursor-not-allowed"
              )}
              aria-label={
                isEnabled ? t("share.disableSharing") : t("share.enableSharing")
              }
              role="switch"
              aria-checked={isEnabled}
            >
              {loading ? (
                <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
              ) : (
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              )}
            </button>
          </div>

          {/* Share URL */}
          {isEnabled && shareUrl && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">
                {t("share.anyoneCanView")}
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-secondary)] outline-none truncate"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 p-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {!isEnabled && (
            <p className="text-xs text-[var(--text-secondary)]">
              {t("share.enableToGenerate")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

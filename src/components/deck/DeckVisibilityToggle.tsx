"use client";
// Toggle deck visibility: Public (visible on profile) vs Private
import { useState } from "react";
import { Globe, Lock, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface DeckVisibilityToggleProps {
  readonly deckId: string;
  readonly initialIsPublic: boolean;
  readonly username?: string | null;
  readonly className?: string;
}

export function DeckVisibilityToggle({
  deckId,
  initialIsPublic,
  username,
  className,
}: DeckVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const next = !isPublic;
    try {
      const res = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (res.ok) {
        setIsPublic(next);
      }
    } catch (err) {
      console.error("[DeckVisibilityToggle] error", err);
    } finally {
      setLoading(false);
    }
  };

  const publicUrl =
    typeof globalThis.location !== "undefined"
      ? `${globalThis.location.origin}/deck/${deckId}`
      : `/deck/${deckId}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleToggle}
        disabled={loading}
        role="switch"
        aria-checked={isPublic}
        aria-label={isPublic ? "Make deck private" : "Make deck public"}
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
          isPublic ? "bg-[var(--accent)]" : "bg-[var(--border)]",
          loading && "opacity-60 cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
        ) : (
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
              isPublic ? "translate-x-4" : "translate-x-0"
            )}
          />
        )}
      </button>

      <div className="flex items-center gap-1.5">
        {isPublic ? (
          <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        )}
        <span className="text-xs text-[var(--text-secondary)]">
          {isPublic ? "Public" : "Private"}
        </span>
      </div>

      {isPublic && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--accent)] hover:underline ml-1"
        >
          View
        </a>
      )}

      {isPublic && !username && (
        <span className="text-xs text-amber-400 ml-1" title="Set a username to appear on your profile">
          ⚠ No username set
        </span>
      )}
    </div>
  );
}

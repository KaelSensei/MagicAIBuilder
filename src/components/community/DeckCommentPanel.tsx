"use client";
// Threaded comment stream on a public deck page.
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { DeckCommentThread } from "@/lib/community/comments";
import { CommentForm } from "./CommentForm";
import { CommentThreadItem, type CommentActions } from "./CommentThreadItem";

export interface DeckCommentsResponse {
  readonly comments: readonly DeckCommentThread[];
  readonly count: number;
}

interface DeckCommentPanelProps {
  readonly deckId: string;
  /** True when the viewer owns this deck — they may delete any comment. */
  readonly isOwner: boolean;
  readonly isSignedIn: boolean;
}

export function DeckCommentPanel({ deckId, isOwner, isSignedIn }: DeckCommentPanelProps) {
  const t = useTranslations("deck.comments");
  const [data, setData] = useState<DeckCommentsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const endpoint = `/api/community/decks/${encodeURIComponent(deckId)}/comments`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (res.ok) setData(await res.json());
    } catch {
      // A failed read leaves the panel in its loading state; the write
      // actions below surface their own errors.
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs one mutation and reloads the stream; true means it stuck. */
  const mutate = useCallback(
    async (path: string, init: RequestInit): Promise<boolean> => {
      setSaving(true);
      setFailed(false);
      try {
        const res = await fetch(`${endpoint}${path}`, init);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await load();
        return true;
      } catch {
        setFailed(true);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [endpoint, load]
  );

  const post = (body: string, parentId?: string) =>
    mutate("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parentId === undefined ? { body } : { body, parentId }),
    });

  const actions: CommentActions = {
    onReply: (parentId, body) => post(body, parentId),
    onEdit: (commentId, body) =>
      mutate(`/${encodeURIComponent(commentId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onDelete: (commentId) =>
      mutate(`/${encodeURIComponent(commentId)}`, { method: "DELETE" }),
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-4">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t("title")}</h2>
        {data && (
          <span className="text-sm text-[var(--text-secondary)]">
            {t("count", { count: data.count })}
          </span>
        )}
      </header>

      {data && (
        <>
          {isSignedIn ? (
            <CommentForm saving={saving} submitLabel={t("post")} onSubmit={(body) => void post(body)} />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">{t("signInToComment")}</p>
          )}

          {failed && <p className="text-xs text-red-400">{t("failed")}</p>}

          {data.comments.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-4 list-none p-0 m-0 border-t border-[var(--border)] pt-4">
              {data.comments.map((comment) => (
                <CommentThreadItem
                  key={comment.id}
                  comment={comment}
                  isSignedIn={isSignedIn}
                  viewerOwnsDeck={isOwner}
                  actions={actions}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

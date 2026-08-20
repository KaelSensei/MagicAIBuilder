"use client";
// Threaded comment stream on a public deck page.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownUp } from "lucide-react";
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
  const tCommon = useTranslations("common");
  const [data, setData] = useState<DeckCommentsResponse | null>(null);
  /** A failed *read*, distinct from the per-action write errors below. */
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  // The API serves newest first; replies inside a thread stay chronological
  // either way — only the top-level order flips.
  const [newestFirst, setNewestFirst] = useState(true);

  const endpoint = `/api/community/decks/${encodeURIComponent(deckId)}/comments`;

  /**
   * Reads the stream. A failure has to be *visible*: every part of the body
   * is gated on `data`, so silently ignoring a non-OK response or a thrown
   * fetch left the panel showing its header and nothing else — a broken read
   * looked exactly like a deck nobody had commented on, and never recovered.
   */
  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        setLoadFailed(true);
        return;
      }
      setData(await res.json());
    } catch {
      setLoadFailed(true);
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

  const orderedComments = useMemo(() => {
    if (!data) return [];
    return newestFirst ? data.comments : [...data.comments].reverse();
  }, [data, newestFirst]);

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
        {data && data.comments.length > 1 && (
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="ml-auto flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowDownUp className="w-3 h-3" aria-hidden="true" />
            {newestFirst ? t("sortNewest") : t("sortOldest")}
          </button>
        )}
      </header>

      {loadFailed && !data && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[var(--text-secondary)]">{t("loadFailed")}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            {tCommon("error.retry")}
          </button>
        </div>
      )}

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
              {orderedComments.map((comment) => (
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

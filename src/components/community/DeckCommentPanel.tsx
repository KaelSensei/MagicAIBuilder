"use client";
/**
 * Threaded comment stream on a public deck page: the count, the sort toggle,
 * the form to post, and the threads with their reply, edit and delete actions.
 *
 * Community context (ui). Reads the stream through `useRemoteResource` and the
 * typed community client (`fetchDeckComments`), writes through `postComment`,
 * `editComment` and `deleteComment`, and reloads the stream after every write.
 * Not responsible for: who may edit or delete a comment, which the route
 * enforces (the thread items only hide the buttons); the request shapes and
 * the 15 s read timeout, which the client owns.
 */
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownUp } from "lucide-react";
import { useRemoteResource } from "@/hooks/useRemoteResource";
import {
  deleteComment,
  editComment,
  fetchDeckComments,
  postComment,
} from "@/lib/community/community-client";
import { CommentForm } from "./CommentForm";
import { CommentThreadItem, type CommentActions } from "./CommentThreadItem";

interface DeckCommentPanelProps {
  readonly deckId: string;
  /** True when the viewer owns this deck — they may delete any comment. */
  readonly isOwner: boolean;
  readonly isSignedIn: boolean;
}

/** The viewer's comment writes as the form and the thread items use them. */
interface CommentWrites {
  /** A write or the reload that follows it is in flight. */
  readonly saving: boolean;
  /** The last write was refused or failed; cleared when the next one starts. */
  readonly failed: boolean;
  /** Posts a top-level comment; resolves true once it stuck. */
  readonly post: (body: string) => Promise<boolean>;
  /** Reply, edit and delete, for the thread items. */
  readonly actions: CommentActions;
}

/**
 * Sends the viewer's comment writes and reloads the stream after each one.
 * Unlike the ratings panel, a write resolves only once the reload has landed,
 * so a thread item keeps its form open and disabled until the stream shows
 * the change, as the panel always did.
 */
function useCommentWrites(
  deckId: string,
  reload: () => Promise<void>
): CommentWrites {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function write(send: () => Promise<unknown>): Promise<boolean> {
    setSaving(true);
    setFailed(false);
    try {
      await send();
      // `reload` never rejects: a failed read shows in the resource's status.
      await reload();
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    saving,
    failed,
    post: (body) => write(() => postComment(deckId, body)),
    actions: {
      onReply: (parentId, body) =>
        write(() => postComment(deckId, body, parentId)),
      onEdit: (commentId, body) =>
        write(() => editComment(deckId, commentId, body)),
      onDelete: (commentId) => write(() => deleteComment(deckId, commentId)),
    },
  };
}

/**
 * Shown when the stream could not be read and nothing is on screen yet. A
 * failed read has to be *visible*: the body renders only once `data` is set,
 * so a swallowed failure looked exactly like a deck nobody had commented on,
 * and never recovered.
 */
function CommentsLoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  const t = useTranslations("deck.comments");
  const tCommon = useTranslations("common");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm text-[var(--text-secondary)]">{t("loadFailed")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs px-2 py-1 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
      >
        {tCommon("error.retry")}
      </button>
    </div>
  );
}

/**
 * The comment stream of one public deck. Signed-out viewers read it and are
 * invited to sign in; signed-in viewers may post and reply, edit or delete
 * their own comments, and the deck's owner may delete any comment.
 */
export function DeckCommentPanel({
  deckId,
  isOwner,
  isSignedIn,
}: DeckCommentPanelProps) {
  const t = useTranslations("deck.comments");
  const loadComments = useCallback(() => fetchDeckComments(deckId), [deckId]);
  const { data, status, reload } = useRemoteResource(loadComments);
  const writes = useCommentWrites(deckId, reload);
  // The API serves newest first; replies inside a thread stay chronological
  // either way — only the top-level order flips.
  const [newestFirst, setNewestFirst] = useState(true);

  const orderedComments = useMemo(() => {
    if (!data) return [];
    return newestFirst ? data.comments : [...data.comments].reverse();
  }, [data, newestFirst]);

  return (
    <section className="flex flex-col gap-4 rounded-[var(--lumen-radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--lumen-shadow-sm)]">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {t("title")}
        </h2>
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

      {status === "failed" && !data && (
        <CommentsLoadFailed onRetry={() => void reload()} />
      )}

      {data && (
        <>
          {isSignedIn ? (
            <CommentForm
              saving={writes.saving}
              submitLabel={t("post")}
              onSubmit={(body) => void writes.post(body)}
            />
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              {t("signInToComment")}
            </p>
          )}

          {writes.failed && (
            <p className="text-xs text-red-400">{t("failed")}</p>
          )}

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
                  actions={writes.actions}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

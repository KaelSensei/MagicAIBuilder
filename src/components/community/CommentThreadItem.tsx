"use client";
// One comment with its nested replies — recursive.
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { DeckCommentThread } from "@/lib/community/comments";
import { CommentForm } from "./CommentForm";
import { UserChip } from "./UserChip";

export interface CommentActions {
  readonly onReply: (parentId: string, body: string) => Promise<boolean>;
  readonly onEdit: (commentId: string, body: string) => Promise<boolean>;
  readonly onDelete: (commentId: string) => Promise<boolean>;
}

interface CommentThreadItemProps {
  readonly comment: DeckCommentThread;
  readonly isSignedIn: boolean;
  /** True when the viewer owns the deck — they may delete any comment */
  readonly viewerOwnsDeck: boolean;
  readonly actions: CommentActions;
}

export function CommentThreadItem({
  comment,
  isSignedIn,
  viewerOwnsDeck,
  actions,
}: CommentThreadItemProps) {
  const t = useTranslations("deck.comments");
  const format = useFormatter();
  const [mode, setMode] = useState<"read" | "reply" | "edit">("read");
  const [saving, setSaving] = useState(false);

  const canDelete = comment.isAuthor || viewerOwnsDeck;
  const wasEdited = comment.updatedAt !== comment.createdAt;

  async function run(action: () => Promise<boolean>) {
    setSaving(true);
    try {
      if (await action()) setMode("read");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <UserChip {...comment.author} />
        {comment.isDeckOwner && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--accent)]/40 text-[var(--accent-text)] font-medium">
            {t("ownerBadge")}
          </span>
        )}
        <span className="text-xs text-[var(--text-secondary)]">
          {format.relativeTime(new Date(comment.createdAt))}
          {wasEdited && ` · ${t("edited")}`}
        </span>
      </div>

      {mode === "edit" ? (
        <CommentForm
          initialValue={comment.body}
          saving={saving}
          submitLabel={t("save")}
          onSubmit={(body) => void run(() => actions.onEdit(comment.id, body))}
          onCancel={() => setMode("read")}
        />
      ) : (
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
          {comment.body}
        </p>
      )}

      {mode === "read" && (
        <div className="flex items-center gap-3">
          {isSignedIn && (
            <button
              type="button"
              onClick={() => setMode("reply")}
              className="text-xs text-[var(--accent-text)] hover:underline"
            >
              {t("reply")}
            </button>
          )}
          {comment.isAuthor && (
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {t("edit")}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                if (window.confirm(t("deleteConfirm"))) {
                  void run(() => actions.onDelete(comment.id));
                }
              }}
              className="text-xs text-[var(--text-secondary)] hover:text-red-400 disabled:opacity-50"
            >
              {t("delete")}
            </button>
          )}
        </div>
      )}

      {mode === "reply" && (
        <CommentForm
          saving={saving}
          submitLabel={t("reply")}
          onSubmit={(body) => void run(() => actions.onReply(comment.id, body))}
          onCancel={() => setMode("read")}
        />
      )}

      {comment.replies.length > 0 && (
        <ul className="flex flex-col gap-3 list-none m-0 mt-1 pl-4 border-l border-[var(--border)]">
          {comment.replies.map((reply) => (
            <CommentThreadItem
              key={reply.id}
              comment={reply}
              isSignedIn={isSignedIn}
              viewerOwnsDeck={viewerOwnsDeck}
              actions={actions}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

"use client";

import { useState } from "react";
import { MessageCircleQuestion } from "lucide-react";

interface FocusedFeedbackLabels {
  readonly title: string;
  readonly ownerHint: string;
  readonly enable: string;
  readonly placeholder: string;
  readonly save: string;
  readonly saving: string;
  readonly error: string;
}

interface FocusedFeedbackPanelProps {
  readonly deckId: string;
  readonly isOwner: boolean;
  readonly initialEnabled: boolean;
  readonly initialQuestion: string;
  readonly labels: FocusedFeedbackLabels;
}

/** Highlights a deck owner's focused request above the public discussion. */
export function FocusedFeedbackPanel({
  deckId,
  isOwner,
  initialEnabled,
  initialQuestion,
  labels,
}: FocusedFeedbackPanelProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [question, setQuestion] = useState(initialQuestion);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const canSave = !saving && (!enabled || question.trim() !== "");

  if (!isOwner && (!enabled || question.trim() === "")) return null;

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seekingFeedback: enabled,
          feedbackQuestion: question.trim() || null,
        }),
      });
      if (!response.ok) setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-sky-400/25 bg-sky-400/[0.07] p-4">
      <div className="flex items-start gap-3">
        <MessageCircleQuestion className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{labels.title}</h2>
          {isOwner ? (
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                />
                {labels.enable}
              </label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={labels.placeholder}
                maxLength={240}
                rows={2}
                className="w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-sky-400"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--text-secondary)]">
                  {failed ? labels.error : labels.ownerHint}
                </span>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={!canSave}
                  className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-60"
                >
                  {saving ? labels.saving : labels.save}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-primary)]">{question}</p>
          )}
        </div>
      </div>
    </section>
  );
}

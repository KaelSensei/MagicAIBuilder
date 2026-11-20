"use client";

/**
 * Opens, loads and saves one deck's private Rule 0 sheet (I-15 slice 1).
 *
 * Deck building, ui, mounted from the deck details panel. The sheet is not
 * fetched until the player opens it. A signed-out response asks them to sign
 * in and does not show a form that would fail.
 *
 * @module deck/RuleZeroSheetSection
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { RuleZeroSheetEditor } from "@/components/deck/RuleZeroSheetEditor";
import { parseSheetResponse } from "@/lib/rule-zero/sheet-response";
import {
  type RuleZeroSheetDraft,
  type SheetSpeed,
} from "@/lib/rule-zero/sheet";

/** A blank sheet a player can fill before the first save. */
const EMPTY_DRAFT: RuleZeroSheetDraft = {
  speed: "core" satisfies SheetSpeed,
  winConditions: [],
  combos: { present: false, note: "" },
  extraTurns: { present: false, note: "" },
  resourceDenial: { present: false, note: "" },
  proxyCount: 0,
  houseRules: "",
};

type Load =
  | { readonly kind: "closed" }
  | { readonly kind: "loading" }
  | { readonly kind: "sign-in" }
  | { readonly kind: "invalid" }
  | {
      readonly kind: "ready";
      readonly id: string | null;
      readonly draft: RuleZeroSheetDraft;
      readonly saving: boolean;
      readonly problem: "invalid" | "unavailable" | null;
      readonly saved: boolean;
    };

interface RuleZeroSheetSectionProps {
  /** The deck whose sheet this is. */
  readonly deckId: string;
}

/** The disclosure the deck details panel shows for the rule 0 sheet. */
export function RuleZeroSheetSection({ deckId }: RuleZeroSheetSectionProps) {
  const t = useTranslations("ruleZero");
  const [load, setLoad] = useState<Load>({ kind: "closed" });

  async function toggle() {
    if (load.kind !== "closed") {
      setLoad({ kind: "closed" });
      return;
    }
    setLoad({ kind: "loading" });
    setLoad(await loadSheet(deckId));
  }

  async function save(draft: RuleZeroSheetDraft) {
    if (load.kind !== "ready") return;
    setLoad({ ...load, saving: true, problem: null, saved: false });
    const next = await saveSheet(deckId, load.id, draft);
    setLoad(
      next.kind === "ready"
        ? next
        : { ...load, saving: false, problem: "unavailable", saved: false }
    );
  }

  return (
    <section className="border-t border-[var(--border)]">
      <button
        type="button"
        className="w-full px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)]"
        aria-expanded={load.kind !== "closed"}
        onClick={() => void toggle()}
      >
        {t("open")}
      </button>
      {load.kind === "loading" ? (
        <p className="px-3 pb-3 text-sm">{t("loading")}</p>
      ) : null}
      {load.kind === "sign-in" ? (
        <p className="px-3 pb-3 text-sm">{t("signIn")}</p>
      ) : null}
      {load.kind === "invalid" ? (
        <p className="px-3 pb-3 text-sm">{t("unavailable")}</p>
      ) : null}
      {load.kind === "ready" ? (
        <RuleZeroSheetEditor
          initial={load.draft}
          empty={load.id === null}
          saving={load.saving}
          problem={load.problem}
          saved={load.saved}
          onSave={(draft) => void save(draft)}
        />
      ) : null}
    </section>
  );
}

/** @returns the phase after GET. */
async function loadSheet(deckId: string): Promise<Load> {
  try {
    const response = await fetch(
      `/api/decks/${encodeURIComponent(deckId)}/rule-zero`
    );
    if (response.status === 401 || response.status === 403)
      return { kind: "sign-in" };
    if (!response.ok) return { kind: "invalid" };
    return readyFrom(await response.json());
  } catch {
    return { kind: "invalid" };
  }
}

/** @returns the phase after POST or PATCH. */
async function saveSheet(
  deckId: string,
  id: string | null,
  draft: RuleZeroSheetDraft
): Promise<Load> {
  try {
    const response = await fetch(
      `/api/decks/${encodeURIComponent(deckId)}/rule-zero`,
      {
        method: id === null ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      }
    );
    if (response.status === 400) {
      return {
        kind: "ready",
        id,
        draft,
        saving: false,
        problem: "invalid",
        saved: false,
      };
    }
    if (!response.ok) {
      return {
        kind: "ready",
        id,
        draft,
        saving: false,
        problem: "unavailable",
        saved: false,
      };
    }
    const stored = parseSheetResponse(await response.json());
    if (stored.kind !== "sheet") {
      return {
        kind: "ready",
        id,
        draft,
        saving: false,
        problem: "unavailable",
        saved: false,
      };
    }
    return {
      kind: "ready",
      id: stored.id,
      draft: stored.draft,
      saving: false,
      problem: null,
      saved: true,
    };
  } catch {
    return {
      kind: "ready",
      id,
      draft,
      saving: false,
      problem: "unavailable",
      saved: false,
    };
  }
}

/** @returns a ready phase, or invalid when the body is not a sheet. */
function readyFrom(body: unknown): Load {
  const parsed = parseSheetResponse(body);
  if (parsed.kind === "empty") {
    return {
      kind: "ready",
      id: null,
      draft: EMPTY_DRAFT,
      saving: false,
      problem: null,
      saved: false,
    };
  }
  if (parsed.kind === "sheet") {
    return {
      kind: "ready",
      id: parsed.id,
      draft: parsed.draft,
      saving: false,
      problem: null,
      saved: false,
    };
  }
  return { kind: "invalid" };
}

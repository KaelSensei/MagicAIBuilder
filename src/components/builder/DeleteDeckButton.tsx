"use client";
/**
 * The builder title bar's "Delete deck" control: a button, the dialog that asks the player to
 * confirm, and the trip back to the library once the deck is gone.
 *
 * The delete is the deck store's `deleteDeck`, the action the library uses, behind the owner-only
 * `DELETE /api/decks/[id]` route. When the trash ships (I-01 slice 12), that action moves the deck
 * there and this control needs no change.
 */
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "@/i18n/navigation";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckDepartureControls } from "@/components/builder/useDeckDeparture";

/** Props of {@link DeleteDeckButton}. */
export interface DeleteDeckButtonProps {
  /** The deck open in the builder. */
  readonly deckId: string;
  /**
   * Tells the page it is leaving before the store drops the deck, and staying if the delete
   * fails, so the page never reports the deck it deleted as missing. Defaults to doing nothing.
   */
  readonly departure?: DeckDepartureControls;
}

/** The departure of a button used outside the builder page: nothing to tell. */
const NO_DEPARTURE: DeckDepartureControls = {
  leave: () => undefined,
  stay: () => undefined,
};

/** Where the confirmation stands: not sent yet, on its way, or refused by the server. */
type DeleteStatus = "idle" | "deleting" | "failed";

/** The confirm button's catalogue key under `builder.deleteDeck`. */
type ConfirmLabel = "confirm" | "deleting" | "waitingForSave";

/**
 * What the confirm button says. A delete on its way says so; otherwise a save still on its way
 * holds the button back, so a delete never races a write the player made a moment before.
 */
function confirmLabel(status: DeleteStatus, isSaving: boolean): ConfirmLabel {
  if (status === "deleting") return "deleting";
  return isSaving ? "waitingForSave" : "confirm";
}

/**
 * Deletes the open deck after the player confirms, then opens the library and says the deck was
 * deleted. Renders nothing for the guest deck, or before the deck is in the store.
 *
 * A refused or failed delete keeps the dialog open with a message; the store leaves the deck and
 * its undo history as they were.
 */
export function DeleteDeckButton({
  deckId,
  departure = NO_DEPARTURE,
}: DeleteDeckButtonProps) {
  const t = useTranslations("builder.deleteDeck");
  const deckName = useDeckStore((state) => state.decks[deckId]?.name ?? null);
  const isSaving = useDeckStore((state) => state.isSyncing);
  const deleteDeck = useDeckStore((state) => state.deleteDeck);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DeleteStatus>("idle");

  // The guest deck lives in this browser only and has its own flow (`GuestDeckNotice`).
  if (deckId === GUEST_DECK_ID || deckName === null) return null;

  const openDialog = () => {
    // The library is where a confirmed delete lands; loading it now shortens the trip there.
    router.prefetch("/decks");
    setOpen(true);
  };

  const close = () => {
    if (status === "deleting") return;
    setOpen(false);
    setStatus("idle");
  };

  const confirm = async () => {
    setStatus("deleting");
    // The store drops the deck inside `deleteDeck`, before this function can navigate, so the
    // page must know it is leaving first.
    departure.leave();
    try {
      await deleteDeck(deckId);
    } catch {
      departure.stay();
      setStatus("failed");
      return;
    }
    // Leave at once: the builder has no deck to show any more.
    router.push("/decks");
    toast.success(t("deleted", { name: deckName }));
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-label={t("button")}
        title={t("button")}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] transition-all hover:border-red-500/60 hover:text-red-400 md:px-3"
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
        <span className="hidden sm:inline">{t("buttonLabel")}</span>
      </button>
      <Modal
        open={open}
        onClose={close}
        title={t("title", { name: deckName })}
        maxWidth="max-w-md"
        showClose={false}
      >
        <DeleteDeckDialogBody
          failed={status === "failed"}
          label={confirmLabel(status, isSaving)}
          onCancel={close}
          onConfirm={() => void confirm()}
        />
      </Modal>
    </>
  );
}

/** Props of {@link DeleteDeckDialogBody}. */
interface DeleteDeckDialogBodyProps {
  /** The last delete was refused or failed. */
  readonly failed: boolean;
  /** What the confirm button says; anything but "confirm" holds it back. */
  readonly label: ConfirmLabel;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** The dialog's warning, its failure message, and Cancel before Delete. */
function DeleteDeckDialogBody({
  failed,
  label,
  onCancel,
  onConfirm,
}: DeleteDeckDialogBodyProps) {
  const t = useTranslations("builder.deleteDeck");

  return (
    <div className="space-y-4 px-5 py-4">
      <p className="text-sm text-[var(--text-secondary)]">{t("description")}</p>
      {failed && (
        <p role="alert" className="text-sm text-red-400">
          {t("failed")}
        </p>
      )}
      {/* Cancel comes first, so the dialog opens on it: the delete cannot be undone. */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface)]"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={label !== "confirm"}
          className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {t(label)}
        </button>
      </div>
    </div>
  );
}

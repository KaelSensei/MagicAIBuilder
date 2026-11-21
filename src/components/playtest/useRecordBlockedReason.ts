"use client";
/**
 * Why the playtest's record bar cannot file the current game, if it cannot.
 *
 * Context: playtest, the UI. `PlaytestModal` passes the result to `RecordResultBar` as its
 * `blockedReason`; kept out of the modal so the modal grows no branch (its size and complexity
 * are under the lint ratchet). Not responsible for the record itself (`RecordResultBar`).
 *
 * @module components/playtest/useRecordBlockedReason
 */
import { useTranslations } from "next-intl";
import { isRandomDeal } from "@/lib/playtest/deal";
import { usePlaytestStore } from "@/lib/playtest/store";

/**
 * The catalogue sentence that says why recording is blocked, or `undefined` when it is not.
 *
 * A game dealt with chosen cards is never filed: its opening hand was not a random deal, so the
 * evidence a session stores (the mulligans, the cards seen) would misstate the deck. Otherwise
 * recording waits while a mulligan's bottom choice is pending, since the counts are not settled
 * until then (CR 103.5).
 *
 * @param choosingBottom - whether a mulligan waits for its bottom choice
 */
export function useRecordBlockedReason(
  choosingBottom: boolean
): string | undefined {
  const t = useTranslations("playtest");
  const randomDeal = usePlaytestStore(
    (state) => state.setup === null || isRandomDeal(state.setup)
  );

  if (!randomDeal) return t("trialCards.recordBlocked");
  if (choosingBottom) return t("recordBlockedByMulligan");
  return undefined;
}

"use client";

/**
 * Form state for a Rule 0 sheet. The editor and its fields share this so
 * neither file imports the other.
 *
 * @module deck/use-rule-zero-form
 */
import { useState, type FormEvent } from "react";
import {
  parseSheetDraft,
  type RuleZeroSheetDraft,
} from "@/lib/rule-zero/sheet";

/** The editable values of the form and the save handler. */
export interface RuleZeroFormState {
  readonly speed: RuleZeroSheetDraft["speed"];
  readonly setSpeed: (speed: RuleZeroSheetDraft["speed"]) => void;
  readonly winConditions: string;
  readonly setWinConditions: (value: string) => void;
  readonly combos: RuleZeroSheetDraft["combos"];
  readonly setCombos: (value: RuleZeroSheetDraft["combos"]) => void;
  readonly extraTurns: RuleZeroSheetDraft["extraTurns"];
  readonly setExtraTurns: (value: RuleZeroSheetDraft["extraTurns"]) => void;
  readonly resourceDenial: RuleZeroSheetDraft["resourceDenial"];
  readonly setResourceDenial: (
    value: RuleZeroSheetDraft["resourceDenial"]
  ) => void;
  readonly proxyCount: string;
  readonly setProxyCount: (value: string) => void;
  readonly houseRules: string;
  readonly setHouseRules: (value: string) => void;
  readonly localInvalid: boolean;
  readonly save: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Holds the declared fields until the player saves a valid draft.
 *
 * @param initial - the sheet as last loaded or saved
 * @param onSave - called with a draft that passed `parseSheetDraft`
 */
export function useRuleZeroForm(
  initial: RuleZeroSheetDraft,
  onSave: (draft: RuleZeroSheetDraft) => void
): RuleZeroFormState {
  const [speed, setSpeed] = useState(initial.speed);
  const [winConditions, setWinConditions] = useState(
    initial.winConditions.join("\n")
  );
  const [combos, setCombos] = useState(initial.combos);
  const [extraTurns, setExtraTurns] = useState(initial.extraTurns);
  const [resourceDenial, setResourceDenial] = useState(initial.resourceDenial);
  const [proxyCount, setProxyCount] = useState(String(initial.proxyCount));
  const [houseRules, setHouseRules] = useState(initial.houseRules);
  const [localInvalid, setLocalInvalid] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseSheetDraft({
      speed,
      winConditions: winConditions
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
      combos,
      extraTurns,
      resourceDenial,
      proxyCount: Number(proxyCount),
      houseRules,
    });
    if (!parsed.ok) {
      setLocalInvalid(true);
      return;
    }
    setLocalInvalid(false);
    onSave(parsed.draft);
  }

  return {
    speed,
    setSpeed,
    winConditions,
    setWinConditions,
    combos,
    setCombos,
    extraTurns,
    setExtraTurns,
    resourceDenial,
    setResourceDenial,
    proxyCount,
    setProxyCount,
    houseRules,
    setHouseRules,
    localInvalid,
    save,
  };
}

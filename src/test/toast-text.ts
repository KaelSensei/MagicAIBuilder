/**
 * The words a player reads in a toast, read from the real catalogs, for tests
 * that record the toasts the code raises without rendering the toast container.
 *
 * Part of the shared test kit. The deck store raises its toasts by catalog key
 * (`LocalizedToastKey`), and the toast container translates each one in the
 * player's locale (I-04). A test that records the raised toasts
 * (`toast-recorder.ts`) reads them back through this module, so it still pins
 * the words the player sees, and it breaks when a key is renamed or its text
 * changes.
 *
 * @module test/toast-text
 */

import type { Mock } from "vitest";
import { createTranslator, type Messages } from "next-intl";
import type { ToastMessage, ToastType } from "@/hooks/useToast";
import { testMessages, type TestLocale } from "@/test/intl-catalogs";
import type { AddToast } from "@/test/toast-recorder";

/**
 * The words of a toast's message, as the toast container shows them.
 *
 * @param message - the message raised: its words, or a catalog key with its values
 * @param locale - the player's locale; English unless given
 * @returns the words the player reads
 */
export function toastText(
  message: ToastMessage,
  locale: TestLocale = "en"
): string {
  if (typeof message === "string") return message;
  // `Messages` keeps the keys as plain strings, as the container's
  // namespace-less `useTranslations()` reads them.
  const translate = createTranslator<Messages>({
    locale,
    messages: testMessages(locale),
  });
  return translate(message.key, message.values);
}

/**
 * Every toast a recorder saw, in order, as its type and the words the player
 * reads.
 *
 * @param add - the spy `recordToasts()` returned
 * @param locale - the player's locale; English unless given
 * @returns one `[type, words]` pair per toast raised
 */
export function recordedToasts(
  add: Mock<AddToast>,
  locale: TestLocale = "en"
): readonly (readonly [ToastType, string])[] {
  return add.mock.calls.map(
    ([type, message]) => [type, toastText(message, locale)] as const
  );
}

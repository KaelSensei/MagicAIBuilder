/**
 * Records the toasts the code under test raises, without mocking the toast
 * module.
 *
 * Part of the shared test kit. The deck store reports a failed save only
 * through `useToastStore.getState().add`, so its tests assert on that call.
 * They used to replace `@/hooks/useToast` with a `vi.mock` factory that did
 * nothing but swap `add` for a spy; ADR 0005 (rule 5) bans new mocks of
 * internal modules. Swapping the action on the real store does the same with
 * no module mock, and leaves the module, its types and its other exports as
 * they are. The spy also skips the real `add`'s auto-dismiss timer.
 *
 * @module test/toast-recorder
 */

import { vi, type Mock } from "vitest";
import {
  useToastStore,
  type ToastMessage,
  type ToastType,
} from "@/hooks/useToast";

/** The toast store's `add` action. */
export type AddToast = (type: ToastType, message: ToastMessage) => void;

/**
 * Replaces the toast store's `add` action with a spy, for the rest of the test
 * file. Call it once, at the top level of the file; `vi.clearAllMocks()`
 * clears its calls between tests.
 *
 * @returns the spy, called with each toast's type and message
 */
export function recordToasts(): Mock<AddToast> {
  const add = vi.fn<AddToast>();
  useToastStore.setState({ add });
  return add;
}

import { expect, it, vi } from "vitest";
import { forEachSequential } from "./sequential";

it("awaits each operation before starting the next item", async () => {
  const events: string[] = [];
  await forEachSequential([1, 2], async (value) => {
    events.push(`start:${value}`);
    await Promise.resolve();
    events.push(`end:${value}`);
  });
  expect(events).toEqual(["start:1", "end:1", "start:2", "end:2"]);
});

it("propagates a failure without starting later operations", async () => {
  const failure = new Error("save failed");
  const operation = vi.fn(async () => { throw failure; });
  await expect(forEachSequential([1, 2], operation)).rejects.toBe(failure);
  expect(operation).toHaveBeenCalledTimes(1);
  expect(operation).toHaveBeenCalledWith(1);
});

it("does not invoke the operation for an empty list", async () => {
  const operation = vi.fn(async () => undefined);
  await forEachSequential([], operation);
  expect(operation).not.toHaveBeenCalled();
});

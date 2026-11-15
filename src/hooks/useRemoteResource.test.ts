import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useRemoteResource, type RemoteResource } from "./useRemoteResource";

/** A promise the test settles by hand, to order the answers of concurrent reads. */
interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A loader whose every call answers the next deferred in order. */
function queuedLoader<T>(...reads: readonly Deferred<T>[]) {
  let next = 0;
  return vi.fn((): Promise<T> => {
    const read = reads[next];
    next += 1;
    if (!read)
      throw new Error(
        `loader called ${next} times, ${reads.length} reads queued`
      );
    return read.promise;
  });
}

/** Starts a reload inside a synchronous act scope; the read settles later, in an awaited one. */
function startReload(result: {
  readonly current: RemoteResource<string>;
}): Promise<void> {
  let reloading: Promise<void> = Promise.resolve();
  act(() => {
    reloading = result.current.reload();
  });
  return reloading;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRemoteResource", () => {
  it("is loading until the read answers, then holds the data", async () => {
    const read = deferred<string>();
    const load = queuedLoader(read);
    const { result } = renderHook(() => useRemoteResource(load));

    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);

    await act(async () => read.resolve("first"));

    expect(result.current.status).toBe("ready");
    expect(result.current.data).toBe("first");
  });

  it("fails without data when the first read rejects", async () => {
    const read = deferred<string>();
    const load = queuedLoader(read);
    const { result } = renderHook(() => useRemoteResource(load));

    await act(async () => read.reject(new Error("offline")));

    expect(result.current.status).toBe("failed");
    expect(result.current.data).toBeNull();
  });

  it("reports a failed reload and keeps the data it already had", async () => {
    const first = deferred<string>();
    const retry = deferred<string>();
    const load = queuedLoader(first, retry);
    const { result } = renderHook(() => useRemoteResource(load));
    await act(async () => first.resolve("first"));

    const reloading = startReload(result);
    await act(async () => retry.reject(new Error("offline")));
    await reloading;

    expect(result.current.status).toBe("failed");
    expect(result.current.data).toBe("first");
  });

  it("reads again on reload, keeps the data meanwhile, and resolves once the new answer has landed", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const load = queuedLoader(first, second);
    const { result } = renderHook(() => useRemoteResource(load));
    await act(async () => first.resolve("first"));

    let settled = false;
    const reloading = startReload(result).then(() => {
      settled = true;
    });
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBe("first");
    await act(async () => {});
    expect(settled).toBe(false);

    await act(async () => second.resolve("second"));
    await reloading;

    expect(settled).toBe(true);
    expect(load).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("ready");
    expect(result.current.data).toBe("second");
  });

  it("keeps the newest answer when an older read resolves last", async () => {
    const first = deferred<string>();
    const older = deferred<string>();
    const newer = deferred<string>();
    const load = queuedLoader(first, older, newer);
    const { result } = renderHook(() => useRemoteResource(load));
    await act(async () => first.resolve("first"));

    const olderReload = startReload(result);
    const newerReload = startReload(result);
    await act(async () => newer.resolve("newer"));
    await act(async () => older.resolve("older"));
    await Promise.all([olderReload, newerReload]);

    expect(result.current.data).toBe("newer");
    expect(result.current.status).toBe("ready");
  });

  it("ignores an older read's failure once a newer read has answered", async () => {
    const older = deferred<string>();
    const newer = deferred<string>();
    const load = queuedLoader(older, newer);
    const { result } = renderHook(() => useRemoteResource(load));

    const reloading = startReload(result);
    await act(async () => newer.resolve("newer"));
    await act(async () => older.reject(new Error("too late")));
    await reloading;

    expect(result.current.status).toBe("ready");
    expect(result.current.data).toBe("newer");
  });

  it("reads again when the loader changes and drops the previous loader's late answer", async () => {
    const previous = deferred<string>();
    const current = deferred<string>();
    const loadPrevious = queuedLoader(previous);
    const loadCurrent = queuedLoader(current);
    const { result, rerender } = renderHook(
      ({ load }: { load: () => Promise<string> }) => useRemoteResource(load),
      { initialProps: { load: loadPrevious } }
    );

    rerender({ load: loadCurrent });
    await act(async () => current.resolve("current"));
    await act(async () => previous.resolve("previous"));

    expect(loadPrevious).toHaveBeenCalledTimes(1);
    expect(loadCurrent).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe("current");
  });

  it("updates nothing when a read answers after unmount", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const read = deferred<string>();
    const load = queuedLoader(read);
    const { unmount } = renderHook(() => useRemoteResource(load));

    unmount();
    await act(async () => read.resolve("late"));

    expect(load).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

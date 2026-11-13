"use client";
/**
 * One remote read as a panel sees it: loading, the data that landed, or a
 * failure, with a reload. The hook owns the state a component used to hand
 * roll around `fetch` (`DeckRatingPanel`, `DeckCommentPanel`), and the one
 * rule they got wrong or re-implemented: only the latest read may land.
 *
 * Shared kernel (browser side); the community panels are its first callers.
 * Not responsible for: the request itself (the caller's loader, usually a
 * typed client function), retries, caching across mounts, and writes. A
 * panel that needs a bounded wait passes a loader that aborts on its own,
 * such as the community client's reads.
 *
 * @module hooks/useRemoteResource
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** Where a read stands. `failed` and `loading` keep the data of the last read that landed. */
export type RemoteResourceStatus = "loading" | "ready" | "failed";

/** The resource as a component renders it. */
export interface RemoteResource<T> {
  readonly status: RemoteResourceStatus;
  /**
   * The latest answer that landed; `null` until the first one does. A reload
   * or a failed reload leaves it in place, so a panel keeps showing what it
   * has while it refreshes.
   */
  readonly data: T | null;
  /**
   * Reads again. Resolves once this read has landed or a newer read has
   * superseded it; never rejects, the failure shows in `status`.
   */
  readonly reload: () => Promise<void>;
}

interface ResourceState<T> {
  readonly status: RemoteResourceStatus;
  readonly data: T | null;
}

/**
 * Reads a remote resource with `load` on mount and whenever `load` changes,
 * and exposes the read's state.
 *
 * `load` must be referentially stable between renders (wrap it in
 * `useCallback` with the ids it reads), as a new function means a new
 * resource and starts a new read. The loader signals failure by rejecting;
 * the rejection reason is not kept, a panel shows one "could not load"
 * message whatever the cause.
 *
 * Latest wins: each read takes a generation number, and an answer whose
 * generation is no longer the current one is dropped, success or failure.
 * Without this, a slow earlier read landed after a newer one and put the
 * previous deck's data on the current page. Unmounting and changing `load`
 * also retire the in-flight generation, so a late answer updates nothing.
 */
export function useRemoteResource<T>(
  load: () => Promise<T>
): RemoteResource<T> {
  const [state, setState] = useState<ResourceState<T>>({
    status: "loading",
    data: null,
  });
  const generation = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    generation.current += 1;
    const thisRead = generation.current;
    setState((previous) => ({ ...previous, status: "loading" }));
    try {
      const data = await load();
      if (thisRead !== generation.current) return;
      setState({ status: "ready", data });
    } catch {
      if (thisRead !== generation.current) return;
      setState((previous) => ({ ...previous, status: "failed" }));
    }
  }, [load]);

  useEffect(() => {
    void reload();
    return () => {
      // Retire the read in flight: its answer belongs to a loader or a
      // mount that no longer exists.
      generation.current += 1;
    };
  }, [reload]);

  return { status: state.status, data: state.data, reload };
}

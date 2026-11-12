/**
 * The way an in-memory Prisma fake answers a call that can fail.
 *
 * Why: a Prisma client call never throws where it is called. It returns a
 * promise, and a failed query rejects that promise. The fakes used to get
 * that for free from `async` methods, but SonarCloud S7503 flags an `async`
 * function that awaits nothing. `Promise.resolve(body())` is not a drop-in
 * replacement: when `body` throws, the call throws, and a route that chains
 * `.catch(…)` or builds several queries before awaiting them takes another
 * path than it would against Prisma.
 */

/**
 * Runs a fake query and settles like a Prisma client call.
 *
 * `body` runs during the call, as the body of an `async` function does, so a
 * write lands before the caller awaits. A method that cannot fail returns
 * `Promise.resolve(…)` directly instead.
 *
 * @param body - The query: reads or writes the fake's tables and returns the
 *   result, or throws the error Prisma would report.
 * @returns A promise that resolves with what `body` returns, or rejects with
 *   what it throws.
 */
export function prismaQuery<Result>(body: () => Result): Promise<Result> {
  return new Promise((resolve) => {
    resolve(body());
  });
}

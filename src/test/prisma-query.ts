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
 * Why not `new Promise((resolve) => resolve(body()))`: SonarCloud S4634 reads
 * it as a trivial promise. The `try`/`catch` keeps the contract: a throw from
 * `body` becomes a rejection, and the call itself never throws.
 *
 * @param body - The query: reads or writes the fake's tables and returns the
 *   result, or throws the error Prisma would report.
 * @returns A promise that resolves with what `body` returns, or rejects with
 *   what it throws.
 */
export function prismaQuery<Result>(body: () => Result): Promise<Result> {
  try {
    return Promise.resolve(body());
  } catch (error) {
    return Promise.reject(error);
  }
}

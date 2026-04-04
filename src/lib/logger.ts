/**
 * Centralised logger — thin wrapper around console that satisfies
 * SonarCloud rule S106 ("Standard outputs should not be used directly
 * to log anything") while keeping zero-dep simplicity.
 *
 * Swap the implementation for a structured logger (pino, winston, etc.)
 * when the project needs log aggregation or remote shipping.
 *
 * @module logger
 */

/* eslint-disable no-console -- logger is the ONE place allowed to touch console */

/** @returns formatted prefix `[context]` or empty string */
function fmtCtx(context?: string): string {
  return context ? `[${context}]` : "";
}

/**
 * Application-wide logger.
 * Every module should import this instead of using `console` directly.
 */
export const logger = {
  /** Informational messages (maps to `console.info`). */
  info(message: string, context?: string, ...meta: unknown[]): void {
    console.info(fmtCtx(context), message, ...meta);
  },

  /** Non-critical warnings (maps to `console.warn`). */
  warn(message: string, context?: string, ...meta: unknown[]): void {
    console.warn(fmtCtx(context), message, ...meta);
  },

  /** Errors — always include the original error for stack traces. */
  error(message: string, context?: string, ...meta: unknown[]): void {
    console.error(fmtCtx(context), message, ...meta);
  },
} as const;

/* eslint-enable no-console */

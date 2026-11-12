/**
 * Empty stand-in for the `server-only` package, used by Vitest only.
 *
 * `server-only` marks a module that must never reach a browser bundle. Next.js
 * resolves it per bundle layer: to an empty module for server code, and to a
 * module that throws for client components, which fails `next build`
 * (`node_modules/next/dist/build/create-compiler-aliases.js`,
 * `createServerOnlyClientOnlyAliases`). Outside Next, the package's `exports`
 * map sends every resolver without the `react-server` condition to the throwing
 * `index.js`. Vitest sets no such condition, so without this stub every test
 * that loads a marked module would fail at import.
 *
 * `vitest.config.ts` aliases `server-only` to this file. The boundary itself is
 * checked by the Next build, not by unit tests.
 *
 * @module test/stubs/server-only
 */
export {};

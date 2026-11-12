/**
 * Rules reference context: the server entry point (ADR 0002).
 *
 * The one thing this context does on the server is read the bundled
 * Comprehensive Rules file, once per process. The comprehensive rules page
 * calls `loadComprehensiveRules` here and hands the parsed document to the
 * view. The loader is `server-only`, and so is this file: a client import of
 * it fails the build. There is no use case yet; the page is the adapter.
 *
 * @module rules-reference/server
 */
import "server-only";

export { loadComprehensiveRules } from "@/modules/rules-reference/infrastructure/rules-file";

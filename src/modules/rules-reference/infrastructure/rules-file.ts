/**
 * The bundled Comprehensive Rules file: where it is and how it is read.
 *
 * The app ships one edition of the rules as a text file next to this module
 * (`data/MagicCompRules-20260807.txt`, effective 2026-08-07). This is the only
 * module of the context that touches the file system, so it is server-only;
 * the parser it feeds lives in `domain/comprehensive-rules.ts`.
 */
import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseComprehensiveRules,
  type ComprehensiveRules,
} from "@/modules/rules-reference/domain/comprehensive-rules";

/**
 * Absolute path of the Comprehensive Rules edition the app ships.
 *
 * It is built from `process.cwd()` and literal segments so that Next.js's
 * file tracing includes the text file in a production build. Keep the
 * segments literal: a path assembled from variables is not traced.
 */
export const RULES_FILE = path.join(
  process.cwd(),
  "src",
  "modules",
  "rules-reference",
  "infrastructure",
  "data",
  "MagicCompRules-20260807.txt"
);

let cachedRules: ComprehensiveRules | null = null;

/**
 * Reads and parses the bundled Comprehensive Rules file.
 *
 * The ~1 MB file is read once per server process and the parsed document is
 * cached for the life of that process, so repeated calls return the same
 * instance. Throws if the file is missing, which only a broken build can cause.
 */
export function loadComprehensiveRules(): ComprehensiveRules {
  cachedRules ??= parseComprehensiveRules(readFileSync(RULES_FILE, "utf8"));
  return cachedRules;
}

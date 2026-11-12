// dependency-cruiser configuration for the runtime import graph: the second
// half of `pnpm arch` (ADR 0007, stage 3). `.dependency-cruiser.cjs` holds the
// first half and the shared options.
//
// TypeScript erases type-only imports, so they never reach a bundle. This half
// drops them (`tsPreCompilationDeps: false`) and checks what ships:
// - no runtime cycle, with no baseline: a type-only cycle that becomes a
//   runtime one fails here even while its type-only form is a known violation
//   of the first half;
// - no browser module reaches a module marked `server-only`, however
//   indirectly (ADR 0002). Next.js fails the build on such an import; this
//   finds it in seconds and names the import chain.
//
// It reads no baseline: both rules hold today, and must keep holding.

const { readdirSync, readFileSync } = require("node:fs");
const { join, relative, sep } = require("node:path");
const { options } = require("./.dependency-cruiser.cjs");

/** Escapes a repository path so a rule matches that one file exactly. */
function exactPath(file) {
  return `^${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
}

/** Every non-test `.ts` and `.tsx` file under `dir`, as a POSIX path from the repository root. */
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    const isSource =
      /\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name);
    return isSource ? [relative(__dirname, path).split(sep).join("/")] : [];
  });
}

/**
 * dependency-cruiser matches paths, not file contents, so the two markers
 * that decide the browser and server split are read here, when the config
 * loads (about 1,000 files, a few milliseconds). A new marker is picked up
 * without editing this file.
 * - `"use client"` as the first statement (comments may precede it) puts a
 *   module, and everything it imports, in the browser bundle.
 * - `import "server-only"` marks a module the build refuses to ship to the
 *   browser (#1356).
 */
function markedModules() {
  const useClient = /^(?:\s|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*(["'])use client\1/;
  const serverOnly = /^import\s+(["'])server-only\1;?\s*$/m;
  const browser = [];
  const server = [];
  for (const file of sourceFiles(join(__dirname, "src"))) {
    const text = readFileSync(join(__dirname, file), "utf8");
    if (useClient.test(text)) browser.push(exactPath(file));
    if (serverOnly.test(text)) server.push(exactPath(file));
  }
  return { browser, server };
}

const MARKED = markedModules();

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-runtime-cycle",
      comment:
        "This import closes a cycle that exists at runtime, so module evaluation order decides which side sees " +
        "`undefined`. Break it: move the shared code into a module both sides can import, or invert the " +
        "dependency (ADR 0007). Runtime cycles are never baselined.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "client-not-server",
      comment:
        'A "use client" module, or a module it imports directly or indirectly, reaches a module marked ' +
        "`server-only`. Everything a client module imports ships to the browser, and Next.js fails the build on " +
        "`server-only` (ADR 0002). Call an API route through its typed client instead, or move the shared pure " +
        "code out of the server module.",
      severity: "error",
      from: { path: MARKED.browser },
      to: { path: MARKED.server, reachable: true },
    },
  ],
  options: {
    ...options,
    // Type-only imports are erased before bundling; following them here would
    // report chains that never ship (for example a client hook importing a
    // route handler's response type).
    tsPreCompilationDeps: false,
  },
};

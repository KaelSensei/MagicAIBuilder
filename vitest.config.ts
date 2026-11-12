import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Only include unit tests — E2E tests are run via Playwright separately
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    // next-auth imports "next/server" without an extension, which Node's ESM
    // loader cannot resolve outside a bundler. Inlining lets Vite resolve it,
    // so a test can drive the real Auth.js route handlers.
    server: { deps: { inline: ["next-auth"] } },
    /**
     * Coverage is measured over **all** of `src`, UI and route handlers
     * included. ADR 0010 (docs/adr/0010-coverage-scope-by-layer.md) records
     * what is measured where and why.
     *
     * Until 2026-08 `src/app/**` and `src/components/**` were excluded here as
     * "not unit-testable" and "covered by Playwright". Both claims were false:
     * those paths had unit tests, and they held two thirds of the statements.
     * SonarCloud still keeps them out of its coverage figure
     * (`sonar-project.properties`), so the Sonar figure and this one measure
     * different scopes and must not be compared.
     *
     * Measured by CI run 43040973372 (PR #1386, 2026-11-11), whose `src` is
     * the `dev` tree at de2bedff. "All files": 83.01% lines, 86.19% branches,
     * 88.74% functions. Lines by folder (approximate, method in ADR 0010):
     *
     *   lib          ~98%    3 of 206 files at 0%
     *   hooks        ~95%    0 of 33 files at 0%
     *   components   ~75%   32 of 201 files at 0%
     *   app          ~71%   17 of 108 files at 0%
     *
     * Everything below is excluded because it genuinely carries no testable
     * runtime behaviour, or needs a runtime a unit test cannot provide. Nothing
     * is excluded for being merely untested.
     */
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Generated files
        "src/generated/**",
        // Type-only files (no runtime code)
        "**/*.d.ts",
        "src/lib/auth/types.ts",
        "src/lib/deck/types.ts",
        "src/lib/deck/share-types.ts",
        "src/lib/collection/types.ts",
        // Infrastructure singletons (require live DB connection)
        "src/lib/db/prisma.ts",
        // Edge middleware (requires full Next.js edge runtime)
        "src/middleware.ts",
      ],
      /**
       * Floors per layer of `src/modules/<context>/` (ADR 0001, ADR 0010).
       * Each glob is checked against the aggregate of every file it matches,
       * across all contexts, and only when coverage runs (`pnpm
       * test:coverage`, the CI step). A glob that matches no file passes, so a
       * floor binds from the first file a context moves into that layer.
       * `ui/`, `client/`, `infrastructure/` and the entry points have no
       * floor yet, like `src/components`, `src/hooks` and `src/lib` today.
       */
      thresholds: {
        "src/modules/*/domain/**": { lines: 90, branches: 90 },
        "src/modules/*/application/**": { lines: 80, branches: 80 },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // The real `server-only` throws unless resolved with the `react-server`
      // condition, which Vitest does not set; the stub says why that is safe.
      "server-only": resolve(__dirname, "./src/test/stubs/server-only.ts"),
    },
  },
});

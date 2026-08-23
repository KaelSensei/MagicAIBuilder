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
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    /**
     * Coverage is measured over **all** of `src`.
     *
     * It was not. `src/app/**` and `src/components/**` were excluded outright,
     * on two justifications that were both false as written: "not unit-testable
     * without full Next.js runtime" and "covered by E2E/integration tests
     * (Playwright)". **53 test files live under those two paths** — 23 API route
     * tests and 29 component tests — so the code was being unit-tested and the
     * results were being thrown away.
     *
     * Between them they hold 19,467 of the repository's 29,231 statements, and
     * the number reported everywhere as the repository's coverage described
     * only the other third. Measured 2026-08-23:
     *
     *   lib          96.6%   0 of 93 files at 0%   <- what "95.44%" meant
     *   hooks        87.4%   3 of 26 files at 0%
     *   components   25.2%  79 of 125 files at 0%
     *   app          25.1%  48 of 69 files at 0%
     *   ------------------------------------------
     *   all of src   48.5%
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
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});

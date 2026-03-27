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
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Next.js app shell — not unit-testable without full Next.js runtime
        "src/app/**",
        // React components — covered by E2E/integration tests (Playwright)
        "src/components/**",
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

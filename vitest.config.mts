import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // Pure-logic tests run in node; component tests opt in to jsdom with a
    // `// @vitest-environment jsdom` docblock.
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", ".claude/**"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "json-summary", "lcov"],
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "supabase/functions/**/*.ts"],
      exclude: ["lib/supabase/database.types.ts", "**/*.test.*"],
      // Floor set a little under the current baseline; ratchet up as coverage grows.
      thresholds: { lines: 60, statements: 60, functions: 55, branches: 55 },
    },
  },
});

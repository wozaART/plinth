import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // Pure-logic tests run in node; component tests opt in to jsdom with a
    // `// @vitest-environment jsdom` docblock.
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "supabase/functions/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      exclude: ["lib/supabase/database.types.ts", "**/*.test.*"],
    },
  },
});

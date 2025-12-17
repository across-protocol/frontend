import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  // The as any typecast is necessary here due to the discrepancy between the vitest and the vite versions in this
  plugins: [react() as any, tsconfigPaths() as any, svgr() as any],
  test: {
    environment: "node",
    setupFiles: ["./setup.vitest.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "api/**", "test/api/**", "e2e-api/**"],
    globals: true,
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    server: {
      deps: {
        inline: [
          "@across-protocol/constants",
          "@across-protocol/sdk",
          "@across-protocol/contracts",
        ],
      },
    },
  },
});

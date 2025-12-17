import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  // The as any typecast is necessary here due to the discrepancy between the vitest and the vite versions in this repo
  plugins: [tsconfigPaths() as any],
  resolve: {
    alias: {
      api: path.resolve(__dirname, "./api"),
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./setup.vitest.ts"],
    include: ["**/*.test.{ts,tsx}"],
    testTimeout: 30000,
    hookTimeout: 30000,
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

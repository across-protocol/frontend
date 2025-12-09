import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths()],
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

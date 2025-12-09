import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  test: {
    environment: "node",
    setupFiles: ["./setup.vitest.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "api/**", "test/api/**", "e2e-api/**"],
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

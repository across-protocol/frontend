import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import eslint from "vite-plugin-eslint";
import EnvironmentPlugin from "vite-plugin-environment";
import { visualizer } from "rollup-plugin-visualizer";
import inject from "@rollup/plugin-inject";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  build: {
    outDir: "build",
    commonjsOptions: {
      include: [],
    },
    rollupOptions: {
      maxParallelFileOps: 100,
      plugins: [
        inject({
          "globalThis.Buffer": ["buffer", "Buffer"],
        }),
      ],
    },
  },
  plugins: [
    react(),
    svgr(),
    tsconfigPaths(),
    eslint({
      exclude: ["**/node_modules/**", "**/sdk/**"],
      failOnError: false,
    }),
    EnvironmentPlugin("all", { prefix: "REACT_APP_" }),
    visualizer({
      template: "raw-data",
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: "bundle-size-analysis.json",
    }),
    nodePolyfills({
      include: ["buffer"],
      globals: {
        Buffer: true,
      },
    }),
  ],
  optimizeDeps: {
    disabled: false,
    include: [
      "@walletconnect/ethereum-provider",
      "rxjs",
      "rxjs/operators",
      "@across-protocol/contracts",
      "@solana/wallet-adapter-base",
      "@solana/web3.js",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});

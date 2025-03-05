import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import eslint from "vite-plugin-eslint";
import EnvironmentPlugin from "vite-plugin-environment";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  build: {
    outDir: "build",
    commonjsOptions: {
      include: [],
    },
    rollupOptions: {
      maxParallelFileOps: 100,
      plugins: [rollupNodePolyFill()],
      external: [
        "@solana/wallet-adapter-base",
        "@solana/wallet-adapter-wallets",
        "@solana/web3.js",
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
  ],
  optimizeDeps: {
    disabled: false,
    include: [
      "@walletconnect/ethereum-provider",
      "rxjs",
      "rxjs/operators",
      "@across-protocol/contracts",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
});

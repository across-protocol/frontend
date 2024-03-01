import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import eslint from "vite-plugin-eslint";
import EnvironmentPlugin from "vite-plugin-environment";

export default defineConfig({
  build: {
    outDir: "build",
    commonjsOptions: {
      include: [],
    },
    rollupOptions: {
      maxParallelFileOps: 100,
      plugins: [rollupNodePolyFill()],
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  },
  plugins: [
    react(),
    svgr(),
    tsconfigPaths(),
    eslint({
      exclude: ["**/node_modules/**", "**/sdk-v2/**"],
    }),
    EnvironmentPlugin("all", { prefix: "REACT_APP_" }),
  ],
  optimizeDeps: {
    disabled: false,
    exclude: ["@web3-onboard/bitget"],
    include: [
      "@web3-onboard/common",
      "@walletconnect/ethereum-provider",
      "rxjs",
      "rxjs/operators",
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

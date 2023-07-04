import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import eslint from "vite-plugin-eslint";
import EnvironmentPlugin from "vite-plugin-environment";

export default defineConfig({
  // https://github.com/vitejs/vite/issues/1973#issuecomment-787571499
  define: {
    "process.env": {},
  },
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
    svgr({ svgrOptions: { icon: true } }),
    tsconfigPaths(),
    eslint(),
    EnvironmentPlugin("all", { prefix: "REACT_APP_" }),
  ],
  optimizeDeps: {
    disabled: false,
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
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
});

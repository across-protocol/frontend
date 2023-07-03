import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import eslint from "vite-plugin-eslint";

export default defineConfig(() => {
  return {
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
        maxParallelFileOps: 50,
        plugins: [
          // Enable rollup polyfills plugin
          // used during production bundling
          rollupNodePolyFill(),
        ],
      },
    },
    plugins: [
      react(),
      svgr({ svgrOptions: { icon: true } }),
      tsconfigPaths(),
      eslint(),
    ],
    optimizeDeps: {
      disabled: false,
      esbuildOptions: {
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true,
          }),
          NodeModulesPolyfillPlugin(),
        ],
      },
    },
  };
});

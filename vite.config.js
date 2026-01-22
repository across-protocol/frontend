import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import eslint from "vite-plugin-eslint";
import EnvironmentPlugin from "vite-plugin-environment";
import { visualizer } from "rollup-plugin-visualizer";
import inject from "@rollup/plugin-inject";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import dotenv from "dotenv";

dotenv.config({
  path: [".env.local", ".env"],
});

const IS_DEBUG = process.env.REACT_APP_DEBUG === "true";
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  build: {
    // convenience for local dev
    minify: !IS_DEBUG,
    outDir: "build",
    sourcemap: SENTRY_AUTH_TOKEN ? "hidden" : false,
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
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"],
      },
    }),
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
    SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: "risk-labs-m6",
        project: "across-frontend",
        authToken: SENTRY_AUTH_TOKEN,
        sourcemaps: {
          filesToDeleteAfterUpload: ["./build/**/*.map"],
        },
        release: {
          name: process.env.REACT_APP_GIT_COMMIT_HASH,
        },
      }),
  ].filter(Boolean),
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

import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";
import webpack from "webpack";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  babel: async () => ({
    presets: [
      ["@babel/preset-env", { targets: "defaults" }],
      "@babel/preset-typescript",
      [
        "@babel/preset-react",
        { runtime: "automatic", importSource: "@emotion/react" },
      ],
    ],
    plugins: [
      ["@emotion/babel-plugin", { sourceMap: true, autoLabel: "dev-only" }],
    ],
  }),
  webpackFinal: async (config) => {
    config.module?.rules?.forEach((rule) => {
      if (
        typeof rule === "object" &&
        rule !== null &&
        "test" in rule &&
        rule.test instanceof RegExp &&
        rule.test.test(".svg")
      ) {
        const originalTest = rule.test;
        rule.test = new RegExp(
          originalTest.source.replace("svg|", ""),
          originalTest.flags
        );
      }
    });
    const svgsWithNamespaceIssues = [
      "arbitrum-sepolia.svg",
      "arbitrum.svg",
      "lisk-sepolia.svg",
      "lisk.svg",
      "zk-sync.svg",
      "circle.svg",
      "arb.svg",
      "lsk.svg",
      "snx.svg",
      "wld.svg",
    ];
    config.module?.rules?.unshift({
      test: /\.svg$/i,
      exclude: new RegExp(`(${svgsWithNamespaceIssues.join("|")})$`),
      enforce: "pre",
      type: "javascript/auto",
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: false,
            exportType: "named",
          },
        },
      ],
    });
    config.module?.rules?.push({
      test: new RegExp(`(${svgsWithNamespaceIssues.join("|")})$`),
      type: "asset/resource",
    });
    if (config.resolve) {
      config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve(__dirname, "../src"),
      ];
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        os: false,
        fs: false,
        path: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
        tty: false,
        url: false,
        util: false,
        assert: false,
        querystring: false,
        events: false,
        constants: false,
        vm: false,
        process: false,
        buffer: require.resolve("buffer/"),
        perf_hooks: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "dd-trace": false,
        "node:crypto": false,
        "node:util": false,
        "node:path": false,
        "node:fs": false,
        "node:os": false,
        "@emotion/react": path.resolve(
          __dirname,
          "../node_modules/@emotion/react"
        ),
        "@emotion/styled": path.resolve(
          __dirname,
          "../node_modules/@emotion/styled"
        ),
        "@emotion/styled/base": path.resolve(
          __dirname,
          "../node_modules/@emotion/styled/base"
        ),
      };
    }
    config.externals = [
      ...(Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : []),
      ({ request }, callback) => {
        if (request === "node:perf_hooks") {
          return callback();
        }
        if (/^node:/.test(request || "")) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      },
      "dd-trace",
    ];
    config.plugins = [
      ...(config.plugins || []),
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^node:perf_hooks$/,
        path.resolve(__dirname, "mocks/node-perf-hooks.js")
      ),
    ];
    config.optimization = {
      ...config.optimization,
      splitChunks: false,
      usedExports: false,
      sideEffects: false,
      concatenateModules: false,
      minimize: false,
    };
    return config;
  },
  // Note: by default, storybook only forwards environment variables that
  //       take the form /^STORYBOOK_/ . The code below creates a 1:1 mapping
  //       of the /^REACT_APP_/ environment variables so that this Storybook
  //       instance can run.
  //
  //       This clears an error in which storybook cannot publish to Chromatic
  //
  //       Relevant Storybook Docs: https://storybook.js.org/docs/react/configure/environment-variables
  env: (config) => ({
    ...config,
    ...Object.keys(process.env).reduce((accumulator, envKey) => {
      if (/^REACT_APP_/.test(envKey)) accumulator[envKey] = process.env[envKey];
      return accumulator;
    }, {}),
  }),
};
export default config;

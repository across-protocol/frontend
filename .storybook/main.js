const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/preset-create-react-app",
  ],
  framework: "@storybook/react",
  core: {
    builder: "webpack4",
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
  webpackFinal: async (config) => {
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      new TsconfigPathsPlugin({
        extensions: config.resolve.extensions,
      }),
    ];
    return config;
  },
};

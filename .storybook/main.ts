import { mergeConfig } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
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
  viteFinal: async (config) => {
    return mergeConfig(config, {
      server: {
        watch: {
          ignored: ["**/.env.*", "**/coverage/**"],
        },
      },
    });
  },
};
export default config;

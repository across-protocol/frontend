import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import eslintConfigPrettier from "eslint-config-prettier/index.js";
import eslintPluginReactHooks from "eslint-plugin-react-hooks/index.js";
import { fixupPluginRules } from "@eslint/compat";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...reactRecommended,
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    plugins: {
      "react-hooks": fixupPluginRules(eslintPluginReactHooks),
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
    },
  },
  eslintConfigPrettier,
  {
    ignores: ["eslint.config.js"],
  },
  {
    rules: {
      "prefer-const": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "utils",
              message: "Import directly from utils/<module> instead of barrel file.",
            },
            {
              name: "components",
              message: "Import directly from components/<Component> instead of barrel file.",
            },
            {
              name: "hooks",
              message: "Import directly from hooks/<hookName> instead of barrel file.",
            },
          ],
          patterns: [
            {
              group: ["**/utils/index", "**/utils/index.ts"],
              message: "Import directly from utils/<module> instead of barrel file.",
            },
            {
              group: ["**/components/index", "**/components/index.ts"],
              message: "Import directly from components/<Component> instead of barrel file.",
            },
            {
              group: ["**/hooks/index", "**/hooks/index.ts"],
              message: "Import directly from hooks/<hookName> instead of barrel file.",
            },
          ],
        },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-children-prop": "off",
      "react/no-unescaped-entities": "off",
    },
  }
);

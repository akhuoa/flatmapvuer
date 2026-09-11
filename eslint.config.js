import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "docs/.vitepress/**", "docs/components/**"],
  },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  prettierConfig,
  {
    files: ["**/*.{js,vue}"],
    plugins: {
      prettier,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
];

import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "docs/.vitepress/**", "docs/components/**"],
  },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.{js,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {},
  },
];

import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import cypress from 'eslint-plugin-cypress';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'docs/.vitepress/**', 'docs/components/**'],
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  prettierConfig,
  {
    ...cypress.configs.recommended,
    files: ['cypress/**/*.js'],
  },
  {
    files: ['**/*.{js,vue}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
        },
      ],
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];

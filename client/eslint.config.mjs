import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
    globalIgnores(['dist/**', '.generated/**', 'node_modules/**']),
    {
        files: ['**/*.{js,mjs,ts}'],
        extends: [js.configs.recommended],
        plugins: {
            '@stylistic': stylistic,
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'error',
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        rules: {
            curly: ['error', 'all'],
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-alert': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-implicit-coercion': 'error',
            'no-param-reassign': 'error',
            'no-return-assign': ['error', 'always'],
            'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
            'object-shorthand': ['error', 'always'],
            'prefer-template': 'error',
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
            '@stylistic/block-spacing': ['error', 'always'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/comma-spacing': ['error', { before: false, after: true }],
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
            '@stylistic/space-before-blocks': ['error', 'always'],
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
            '@stylistic/eol-last': ['error', 'always'],
        },
    },
    {
        files: ['src/**/*.ts', 'vite.config.ts'],
        extends: [tseslint.configs.strictTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': ['error', {
                prefer: 'type-imports',
                fixStyle: 'separate-type-imports',
            }],
            '@typescript-eslint/explicit-member-accessibility': ['error', {
                accessibility: 'explicit',
                overrides: { constructors: 'no-public' },
            }],
            '@typescript-eslint/no-unused-vars': ['error', {
                args: 'all',
                argsIgnorePattern: '^_',
                caughtErrors: 'all',
                caughtErrorsIgnorePattern: '^_',
                ignoreRestSiblings: true,
            }],
            '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/restrict-template-expressions': ['error', {
                allowAny: false,
                allowBoolean: false,
                allowNullish: false,
                allowNumber: true,
                allowRegExp: false,
                allowNever: false,
            }],
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
        },
    },
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            globals: globals.browser,
        },
    },
    {
        files: ['tools/**/*.mjs', 'eslint.config.mjs', 'vite.config.ts'],
        languageOptions: {
            globals: globals.node,
        },
    },
);

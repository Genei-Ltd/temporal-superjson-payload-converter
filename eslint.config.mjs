import globals from 'globals'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts']

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: tsFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs['recommended-type-checked'].rules,
      ...tseslint.configs['stylistic-type-checked'].rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  eslintConfigPrettier,
]

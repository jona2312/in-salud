const parser = require('@typescript-eslint/parser')
const plugin = require('@typescript-eslint/eslint-plugin')
module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'preview-dist/**', 'supabase/functions/**'] },
  { files: ['**/*.ts', '**/*.tsx'], languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } }, plugins: { '@typescript-eslint': plugin }, rules: { 'no-unreachable': 'error', 'no-duplicate-case': 'error', '@typescript-eslint/no-floating-promises': 'off' } },
]

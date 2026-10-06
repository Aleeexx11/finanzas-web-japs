import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Renderiza texto con JSX escapado en lugar de insertar HTML sin sanitizar.',
        },
        {
          selector: 'MemberExpression[property.name="innerHTML"]',
          message: 'No insertes HTML con innerHTML; usa nodos JSX escapados.',
        },
        {
          selector: 'CallExpression[callee.property.name="insertAdjacentHTML"]',
          message: 'No insertes HTML con insertAdjacentHTML; usa nodos JSX escapados.',
        },
        {
          selector: 'CallExpression[callee.object.name="document"][callee.property.name="write"]',
          message: 'No uses document.write para insertar contenido dinámico.',
        },
      ],
    },
  },
])

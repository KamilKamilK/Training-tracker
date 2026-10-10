import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dist-e2e', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Firebase is reached only through the services (AGENTS.md, pkt 3).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.service.ts', 'src/lib/firebaseConfig.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'firebase/firestore', message: 'Use a *.service.ts file for Firestore access.' },
            { name: 'firebase/auth', message: 'Use auth.service.ts for Firebase Authentication.' },
          ],
        },
      ],
    },
  },
])

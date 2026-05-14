import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import eslintConfigPrettier from 'eslint-config-prettier'
import pluginNextConfig from '@next/eslint-plugin-next'
import pluginReactHooks from 'eslint-plugin-react-hooks'

const eslintConfig = [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    ignores: [
      'public/*',
      'node_modules/*',
      '.next/*',
      '.next-env.d.ts',
      // Defensive: dev machines that ran an earlier Synpress-based test
      // setup may still have a .cache-synpress directory holding MetaMask's
      // bundled JS. Linting those would flood the report with errors that
      // aren't ours to fix.
      '.cache-synpress/**',
      '**/.cache-synpress/**',
    ],
  },
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-array-index-key': 'off',
      'react/no-unknown-property': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    plugins: {
      '@next/next': pluginNextConfig,
      'react-hooks': pluginReactHooks,
    },
  },
  eslintConfigPrettier,
]

export default eslintConfig

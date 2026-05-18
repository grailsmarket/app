import type { Preview } from '@storybook/nextjs-vite'

import { StorybookProviders } from '../src/stories/storybook-providers'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'grails-dark',
      values: [
        { name: 'grails-dark', value: '#222222' },
        { name: 'panel', value: '#333333' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    layout: 'centered',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <StorybookProviders>
        <main
          style={
            {
              '--font-inter': 'Inter, Arial, sans-serif',
              '--font-sedan-sc': 'Georgia, serif',
              minHeight: '100vh',
              minWidth: '320px',
              padding: '24px',
            } as React.CSSProperties
          }
        >
          <Story />
        </main>
      </StorybookProviders>
    ),
  ],
}

export default preview

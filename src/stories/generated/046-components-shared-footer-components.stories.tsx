import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/footer/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Extras: Story = {
  name: 'extras',
  render: () => <ComponentStoryRenderer path='src/components/footer/components/extras.tsx' />,
}

export const Pages: Story = {
  name: 'pages',
  render: () => <ComponentStoryRenderer path='src/components/footer/components/pages.tsx' />,
}

export const Sources: Story = {
  name: 'sources',
  render: () => <ComponentStoryRenderer path='src/components/footer/components/sources.tsx' />,
}

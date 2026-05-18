import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/components/CategoryFilter',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoryFilter: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/CategoryFilter/index.tsx' />,
}

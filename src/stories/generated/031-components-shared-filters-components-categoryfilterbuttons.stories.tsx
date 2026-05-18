import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/components/CategoryFilterButtons',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoryFilterAll: Story = {
  name: 'CategoryFilterAll',
  render: () => (
    <ComponentStoryRenderer path='src/components/filters/components/CategoryFilterButtons/CategoryFilterAll.tsx' />
  ),
}

export const CategoryFilterNone: Story = {
  name: 'CategoryFilterNone',
  render: () => (
    <ComponentStoryRenderer path='src/components/filters/components/CategoryFilterButtons/CategoryFilterNone.tsx' />
  ),
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/components/CategoriesCountFilter',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoriesCountFilter: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/CategoriesCountFilter/index.tsx' />,
}

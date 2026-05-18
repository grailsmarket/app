import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/categories/CategoriesPanel',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoriesPanel: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/CategoriesPanel/index.tsx' />,
}

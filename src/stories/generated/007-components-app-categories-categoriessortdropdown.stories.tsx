import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/categories/CategoriesSortDropdown',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoriesSortDropdown: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/CategoriesSortDropdown/index.tsx' />,
}

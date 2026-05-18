import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/ActivityFilter/TypeFilter',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TypeFilter: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/filters/ActivityFilter/TypeFilter/index.tsx' />,
}

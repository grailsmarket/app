import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/components/MarketFilter',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const MarketFilter: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/MarketFilter/index.tsx' />,
}

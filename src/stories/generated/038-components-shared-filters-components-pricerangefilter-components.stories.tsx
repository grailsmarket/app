import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/components/PriceRangeFilter/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const PriceDenominatorSwitch: Story = {
  name: 'PriceDenominatorSwitch',
  render: () => (
    <ComponentStoryRenderer path='src/components/filters/components/PriceRangeFilter/components/PriceDenominatorSwitch.tsx' />
  ),
}

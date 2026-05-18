import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/purchase',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const BuyNowModal: Story = {
  name: 'buyNowModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/purchase/buyNowModal.tsx' />,
}

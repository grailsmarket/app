import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/transfer',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TransferModal: Story = {
  name: 'transferModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/transfer/transferModal.tsx' />,
}

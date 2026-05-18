import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/records/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TransactionStatusRow: Story = {
  name: 'TransactionStatusRow',
  render: () => <ComponentStoryRenderer path='src/components/modal/records/components/TransactionStatusRow.tsx' />,
}

export const ImageUploadModal: Story = {
  name: 'imageUploadModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/records/components/imageUploadModal.tsx' />,
}

export const InputWithResolution: Story = {
  name: 'inputWithResolution',
  render: () => <ComponentStoryRenderer path='src/components/modal/records/components/inputWithResolution.tsx' />,
}

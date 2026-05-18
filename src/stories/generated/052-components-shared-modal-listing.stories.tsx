import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/listing',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CancelListingModal: Story = {
  name: 'cancelListingModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/listing/cancelListingModal.tsx' />,
}

export const CreateListingModal: Story = {
  name: 'createListingModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/listing/createListingModal.tsx' />,
}

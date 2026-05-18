import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/offer',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const AcceptOfferModal: Story = {
  name: 'acceptOfferModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/offer/acceptOfferModal.tsx' />,
}

export const CancelOfferModal: Story = {
  name: 'cancelOfferModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/offer/cancelOfferModal.tsx' />,
}

export const CreateOfferModal: Story = {
  name: 'createOfferModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/offer/createOfferModal.tsx' />,
}

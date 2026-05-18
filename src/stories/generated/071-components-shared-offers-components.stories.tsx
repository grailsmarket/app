import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/offers/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Actions: Story = {
  name: 'actions',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/actions.tsx' />,
}

export const Expires: Story = {
  name: 'expires',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/expires.tsx' />,
}

export const LoadingRow: Story = {
  name: 'loadingRow',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/loadingRow.tsx' />,
}

export const Name: Story = {
  name: 'name',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/name.tsx' />,
}

export const OfferAmount: Story = {
  name: 'offerAmount',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/offerAmount.tsx' />,
}

export const OfferRow: Story = {
  name: 'offerRow',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/offerRow.tsx' />,
}

export const Offerrer: Story = {
  name: 'offerrer',
  render: () => <ComponentStoryRenderer path='src/components/offers/components/offerrer.tsx' />,
}

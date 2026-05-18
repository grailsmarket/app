import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/domains/table/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CartIcon: Story = {
  name: 'CartIcon',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/CartIcon.tsx' />,
}

export const Price: Story = {
  name: 'Price',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/Price.tsx' />,
}

export const RegistryPrice: Story = {
  name: 'RegistryPrice',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/RegistryPrice.tsx' />,
}

export const TableLoadingRow: Story = {
  name: 'TableLoadingRow',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/TableLoadingRow.tsx' />,
}

export const TableRow: Story = {
  name: 'TableRow',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/TableRow.tsx' />,
}

export const Actions: Story = {
  name: 'actions',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/actions.tsx' />,
}

export const Expiration: Story = {
  name: 'expiration',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/expiration.tsx' />,
}

export const HighestOffer: Story = {
  name: 'highestOffer',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/highestOffer.tsx' />,
}

export const LastSale: Story = {
  name: 'lastSale',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/lastSale.tsx' />,
}

export const Name: Story = {
  name: 'name',
  render: () => <ComponentStoryRenderer path='src/components/domains/table/components/name.tsx' />,
}

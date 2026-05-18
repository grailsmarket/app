import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/domains/grid/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Actions: Story = {
  name: 'actions',
  render: () => <ComponentStoryRenderer path='src/components/domains/grid/components/actions.tsx' />,
}

export const Card: Story = {
  name: 'card',
  render: () => <ComponentStoryRenderer path='src/components/domains/grid/components/card.tsx' />,
}

export const GridLoadingRows: Story = {
  name: 'gridLoadingRows',
  render: () => <ComponentStoryRenderer path='src/components/domains/grid/components/gridLoadingRows.tsx' />,
}

export const LoadingCard: Story = {
  name: 'loadingCard',
  render: () => <ComponentStoryRenderer path='src/components/domains/grid/components/loadingCard.tsx' />,
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/cart/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActionButtons: Story = {
  name: 'actionButtons',
  render: () => <ComponentStoryRenderer path='src/components/cart/components/actionButtons.tsx' />,
}

export const DomainItem: Story = {
  name: 'domainItem',
  render: () => <ComponentStoryRenderer path='src/components/cart/components/domainItem.tsx' />,
}

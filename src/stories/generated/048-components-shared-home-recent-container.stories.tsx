import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/home/recent-container',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const RecentContainer: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/home/recent-container/index.tsx' />,
}

export const Premium: Story = {
  name: 'premium',
  render: () => <ComponentStoryRenderer path='src/components/home/recent-container/premium.tsx' />,
}

export const Registrations: Story = {
  name: 'registrations',
  render: () => <ComponentStoryRenderer path='src/components/home/recent-container/registrations.tsx' />,
}

export const Sales: Story = {
  name: 'sales',
  render: () => <ComponentStoryRenderer path='src/components/home/recent-container/sales.tsx' />,
}

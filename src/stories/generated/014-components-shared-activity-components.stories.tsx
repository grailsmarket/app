import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/activity/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActivityRow: Story = {
  name: 'activityRow',
  render: () => <ComponentStoryRenderer path='src/components/activity/components/activityRow.tsx' />,
}

export const Event: Story = {
  name: 'event',
  render: () => <ComponentStoryRenderer path='src/components/activity/components/event.tsx' />,
}

export const LoadingRow: Story = {
  name: 'loadingRow',
  render: () => <ComponentStoryRenderer path='src/components/activity/components/loadingRow.tsx' />,
}

export const Name: Story = {
  name: 'name',
  render: () => <ComponentStoryRenderer path='src/components/activity/components/name.tsx' />,
}

export const Price: Story = {
  name: 'price',
  render: () => <ComponentStoryRenderer path='src/components/activity/components/price.tsx' />,
}

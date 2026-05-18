import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/notifications/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const LoadingRow: Story = {
  name: 'loadingRow',
  render: () => <ComponentStoryRenderer path='src/components/modal/notifications/components/loadingRow.tsx' />,
}

export const NotificationRow: Story = {
  name: 'notificationRow',
  render: () => <ComponentStoryRenderer path='src/components/modal/notifications/components/notificationRow.tsx' />,
}

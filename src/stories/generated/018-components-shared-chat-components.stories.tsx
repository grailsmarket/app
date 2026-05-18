import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/chat/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ChatRow: Story = {
  name: 'chatRow',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chatRow.tsx' />,
}

export const ListView: Story = {
  name: 'listView',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/listView.tsx' />,
}

export const SendMessageButton: Story = {
  name: 'sendMessageButton',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/sendMessageButton.tsx' />,
}

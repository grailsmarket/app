import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/chat',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Chat: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/chat/index.tsx' />,
}

export const SocketMount: Story = {
  name: 'socketMount',
  render: () => <ComponentStoryRenderer path='src/components/chat/socketMount.tsx' />,
}

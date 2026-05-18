import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/chat/components/new-chat',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const EFPFrineds: Story = {
  name: 'EFPFrineds',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/new-chat/EFPFrineds.tsx' />,
}

export const NewChatView: Story = {
  name: 'newChatView',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/new-chat/newChatView.tsx' />,
}

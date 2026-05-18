import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/chat/components/chat',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Composer: Story = {
  name: 'composer',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chat/composer.tsx' />,
}

export const DayDivider: Story = {
  name: 'dayDivider',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chat/dayDivider.tsx' />,
}

export const MentionDropdown: Story = {
  name: 'mentionDropdown',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chat/mentionDropdown.tsx' />,
}

export const MessageRow: Story = {
  name: 'messageRow',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chat/messageRow.tsx' />,
}

export const ThreadView: Story = {
  name: 'threadView',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chat/threadView.tsx' />,
}

export const TypingDots: Story = {
  name: 'typingDots',
  render: () => <ComponentStoryRenderer path='src/components/chat/components/chat/typingDots.tsx' />,
}

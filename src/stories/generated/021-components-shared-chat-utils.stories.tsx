import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/chat/utils',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const LinkifyMessage: Story = {
  name: 'linkifyMessage',
  render: () => <ComponentStoryRenderer path='src/components/chat/utils/linkifyMessage.tsx' />,
}

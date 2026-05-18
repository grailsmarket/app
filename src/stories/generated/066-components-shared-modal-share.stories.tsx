import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/share',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ShareModal: Story = {
  name: 'shareModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/share/shareModal.tsx' />,
}

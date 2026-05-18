import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/comments',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CommentRow: Story = {
  name: 'commentRow',
  render: () => <ComponentStoryRenderer path='src/components/comments/commentRow.tsx' />,
}

export const Composer: Story = {
  name: 'composer',
  render: () => <ComponentStoryRenderer path='src/components/comments/composer.tsx' />,
}

export const DeleteCommentModal: Story = {
  name: 'deleteCommentModal',
  render: () => <ComponentStoryRenderer path='src/components/comments/deleteCommentModal.tsx' />,
}

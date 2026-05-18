import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/renewal',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ExtendModal: Story = {
  name: 'extendModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/renewal/extendModal.tsx' />,
}

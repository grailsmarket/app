import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/search',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const GlobalSearchModal: Story = {
  name: 'globalSearchModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/search/globalSearchModal.tsx' />,
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/list-settings',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ListSettings: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/modal/list-settings/index.tsx' />,
}

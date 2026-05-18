import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/settings',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const SettingsModal: Story = {
  name: 'settingsModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/settings/settingsModal.tsx' />,
}

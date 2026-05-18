import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/list-settings/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ResetSlotWarning: Story = {
  name: 'reset-slot-warning',
  render: () => <ComponentStoryRenderer path='src/components/modal/list-settings/components/reset-slot-warning.tsx' />,
}

export const SettingsInput: Story = {
  name: 'settings-input',
  render: () => <ComponentStoryRenderer path='src/components/modal/list-settings/components/settings-input.tsx' />,
}

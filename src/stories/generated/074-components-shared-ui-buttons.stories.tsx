import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/ui/buttons',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {
  name: 'primary',
  render: () => <ComponentStoryRenderer path='src/components/ui/buttons/primary.tsx' />,
}

export const Secondary: Story = {
  name: 'secondary',
  render: () => <ComponentStoryRenderer path='src/components/ui/buttons/secondary.tsx' />,
}

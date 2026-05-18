import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/poap',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ClaimPoap: Story = {
  name: 'claimPoap',
  render: () => <ComponentStoryRenderer path='src/components/modal/poap/claimPoap.tsx' />,
}

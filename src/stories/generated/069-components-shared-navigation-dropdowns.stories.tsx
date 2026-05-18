import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/navigation/dropdowns',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Categories: Story = {
  name: 'categories',
  render: () => <ComponentStoryRenderer path='src/components/navigation/dropdowns/categories.tsx' />,
}

export const Explore: Story = {
  name: 'explore',
  render: () => <ComponentStoryRenderer path='src/components/navigation/dropdowns/explore.tsx' />,
}

export const Leaderboard: Story = {
  name: 'leaderboard',
  render: () => <ComponentStoryRenderer path='src/components/navigation/dropdowns/leaderboard.tsx' />,
}

export const More: Story = {
  name: 'more',
  render: () => <ComponentStoryRenderer path='src/components/navigation/dropdowns/more.tsx' />,
}

export const Premium: Story = {
  name: 'premium',
  render: () => <ComponentStoryRenderer path='src/components/navigation/dropdowns/premium.tsx' />,
}

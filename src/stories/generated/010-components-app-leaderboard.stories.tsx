import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/leaderboard',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const LeaderboardFilters: Story = {
  name: 'LeaderboardFilters',
  render: () => <ComponentStoryRenderer path='src/app/leaderboard/components/LeaderboardFilters.tsx' />,
}

export const LeaderboardList: Story = {
  name: 'LeaderboardList',
  render: () => <ComponentStoryRenderer path='src/app/leaderboard/components/LeaderboardList.tsx' />,
}

export const LeaderboardRow: Story = {
  name: 'LeaderboardRow',
  render: () => <ComponentStoryRenderer path='src/app/leaderboard/components/LeaderboardRow.tsx' />,
}

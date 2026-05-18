import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/analytics',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const AnalyticsChart: Story = {
  name: 'AnalyticsChart',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/AnalyticsChart.tsx' />,
}

export const AnalyticsContent: Story = {
  name: 'AnalyticsContent',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/AnalyticsContent.tsx' />,
}

export const AnalyticsFilters: Story = {
  name: 'AnalyticsFilters',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/AnalyticsFilters.tsx' />,
}

export const AnalyticsRow: Story = {
  name: 'AnalyticsRow',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/AnalyticsRow.tsx' />,
}

export const ChartsSection: Story = {
  name: 'ChartsSection',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/ChartsSection.tsx' />,
}

export const TopListCard: Story = {
  name: 'TopListCard',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/TopListCard.tsx' />,
}

export const TopListsSection: Story = {
  name: 'TopListsSection',
  render: () => <ComponentStoryRenderer path='src/app/analytics/components/TopListsSection.tsx' />,
}

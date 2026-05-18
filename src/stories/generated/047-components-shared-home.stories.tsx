import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/home',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const BulkTools: Story = {
  name: 'bulkTools',
  render: () => <ComponentStoryRenderer path='src/components/home/bulkTools.tsx' />,
}

export const DisplayedCard: Story = {
  name: 'displayedCard',
  render: () => <ComponentStoryRenderer path='src/components/home/displayedCard.tsx' />,
}

export const FrequentlyAskedQuestions: Story = {
  name: 'frequentlyAskedQuestions',
  render: () => <ComponentStoryRenderer path='src/components/home/frequentlyAskedQuestions.tsx' />,
}

export const HeroSearch: Story = {
  name: 'heroSearch',
  render: () => <ComponentStoryRenderer path='src/components/home/heroSearch.tsx' />,
}

export const LiveActivity: Story = {
  name: 'liveActivity',
  render: () => <ComponentStoryRenderer path='src/components/home/liveActivity.tsx' />,
}

export const Testemonials: Story = {
  name: 'testemonials',
  render: () => <ComponentStoryRenderer path='src/components/home/testemonials.tsx' />,
}

export const TopCategories: Story = {
  name: 'topCategories',
  render: () => <ComponentStoryRenderer path='src/components/home/topCategories.tsx' />,
}

export const TwitterBot: Story = {
  name: 'twitterBot',
  render: () => <ComponentStoryRenderer path='src/components/home/twitterBot.tsx' />,
}

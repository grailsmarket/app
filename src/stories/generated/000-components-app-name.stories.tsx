import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/[name]',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const PremiumPriceControls: Story = {
  name: 'PremiumPriceControls',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/PremiumPriceControls.tsx' />,
}

export const PremiumPriceGraph: Story = {
  name: 'PremiumPriceGraph',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/PremiumPriceGraph.tsx' />,
}

export const Actions: Story = {
  name: 'actions',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/actions.tsx' />,
}

export const Activity: Story = {
  name: 'activity',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/activity.tsx' />,
}

export const Categories: Story = {
  name: 'categories',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/categories.tsx' />,
}

export const CommentsPanel: Story = {
  name: 'commentsPanel',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/commentsPanel.tsx' />,
}

export const KeywordMetrics: Story = {
  name: 'keywordMetrics',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/keywordMetrics.tsx' />,
}

export const Listings: Story = {
  name: 'listings',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/listings.tsx' />,
}

export const Metadata: Story = {
  name: 'metadata',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/metadata.tsx' />,
}

export const Name: Story = {
  name: 'name',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/name.tsx' />,
}

export const Offers: Story = {
  name: 'offers',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/offers.tsx' />,
}

export const PrimaryDetails: Story = {
  name: 'primaryDetails',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/primaryDetails.tsx' />,
}

export const Register: Story = {
  name: 'register',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/register.tsx' />,
}

export const Roles: Story = {
  name: 'roles',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/roles.tsx' />,
}

export const SecondaryDetails: Story = {
  name: 'secondaryDetails',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/secondaryDetails.tsx' />,
}

export const SimilarNames: Story = {
  name: 'similarNames',
  render: () => <ComponentStoryRenderer path='src/app/[name]/components/similarNames.tsx' />,
}

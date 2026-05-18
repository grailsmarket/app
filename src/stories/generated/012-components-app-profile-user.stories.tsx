import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/profile/[user]',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActionButtons: Story = {
  name: 'actionButtons',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/actionButtons.tsx' />,
}

export const Activity: Story = {
  name: 'activity',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/activity.tsx' />,
}

export const BrokerPanel: Story = {
  name: 'brokerPanel',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/brokerPanel.tsx' />,
}

export const Details: Story = {
  name: 'details',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/details.tsx' />,
}

export const Domains: Story = {
  name: 'domains',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/domains.tsx' />,
}

export const MainPanel: Story = {
  name: 'main-panel',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/main-panel.tsx' />,
}

export const OfferPanel: Story = {
  name: 'offerPanel',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/offerPanel.tsx' />,
}

export const Profile: Story = {
  name: 'profile',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/profile.tsx' />,
}

export const TabSwitcher: Story = {
  name: 'tabSwitcher',
  render: () => <ComponentStoryRenderer path='src/app/profile/[user]/components/tabSwitcher.tsx' />,
}

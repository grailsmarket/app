import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/marketplace',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActionButtons: Story = {
  name: 'actionButtons',
  render: () => <ComponentStoryRenderer path='src/app/marketplace/components/actionButtons.tsx' />,
}

export const ActivityPanel: Story = {
  name: 'activityPanel',
  render: () => <ComponentStoryRenderer path='src/app/marketplace/components/activityPanel.tsx' />,
}

export const DomainPanel: Story = {
  name: 'domainPanel',
  render: () => <ComponentStoryRenderer path='src/app/marketplace/components/domainPanel.tsx' />,
}

export const MainPanel: Story = {
  name: 'mainPanel',
  render: () => <ComponentStoryRenderer path='src/app/marketplace/components/mainPanel.tsx' />,
}

export const TabSwitcher: Story = {
  name: 'tabSwitcher',
  render: () => <ComponentStoryRenderer path='src/app/marketplace/components/tabSwitcher.tsx' />,
}

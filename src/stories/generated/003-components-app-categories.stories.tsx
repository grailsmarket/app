import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/categories',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Activity: Story = {
  name: 'activity',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/activity.tsx' />,
}

export const AllHolderRow: Story = {
  name: 'allHolderRow',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/allHolderRow.tsx' />,
}

export const AllHoldersPanel: Story = {
  name: 'allHoldersPanel',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/allHoldersPanel.tsx' />,
}

export const Categories: Story = {
  name: 'categories',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/categories.tsx' />,
}

export const CategoryCard: Story = {
  name: 'categoryCard',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/categoryCard.tsx' />,
}

export const CategoryRow: Story = {
  name: 'categoryRow',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/categoryRow.tsx' />,
}

export const DomainsPanel: Story = {
  name: 'domainsPanel',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/domainsPanel.tsx' />,
}

export const TabSwitcher: Story = {
  name: 'tabSwitcher',
  render: () => <ComponentStoryRenderer path='src/app/categories/components/tabSwitcher.tsx' />,
}

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/categories/[category]',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Activity: Story = {
  name: 'activity',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/activity.tsx' />,
}

export const Category: Story = {
  name: 'category',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/category.tsx' />,
}

export const CategoryDetails: Story = {
  name: 'categoryDetails',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/categoryDetails.tsx' />,
}

export const Domains: Story = {
  name: 'domains',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/domains.tsx' />,
}

export const HolderRow: Story = {
  name: 'holderRow',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/holderRow.tsx' />,
}

export const Holders: Story = {
  name: 'holders',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/holders.tsx' />,
}

export const MainPanel: Story = {
  name: 'main-panel',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/main-panel.tsx' />,
}

export const TabSwitcher: Story = {
  name: 'tabSwitcher',
  render: () => <ComponentStoryRenderer path='src/app/categories/[category]/components/tabSwitcher.tsx' />,
}

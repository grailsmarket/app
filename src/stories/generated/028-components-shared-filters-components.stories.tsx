import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/filters/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoryFilterTab: Story = {
  name: 'CategoryFilterTab',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/CategoryFilterTab.tsx' />,
}

export const FilterDropdown: Story = {
  name: 'FilterDropdown',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/FilterDropdown.tsx' />,
}

export const FilterSelector: Story = {
  name: 'FilterSelector',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/FilterSelector.tsx' />,
}

export const NavLink: Story = {
  name: 'NavLink',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/NavLink.tsx' />,
}

export const UnexpandedFilter: Story = {
  name: 'UnexpandedFilter',
  render: () => <ComponentStoryRenderer path='src/components/filters/components/UnexpandedFilter.tsx' />,
}

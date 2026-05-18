import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/domains',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActionsDropdown: Story = {
  name: 'actionsDropdown',
  render: () => <ComponentStoryRenderer path='src/components/domains/actionsDropdown.tsx' />,
}

export const Domains: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/domains/index.tsx' />,
}

export const SortDropdown: Story = {
  name: 'sortDropdown',
  render: () => <ComponentStoryRenderer path='src/components/domains/sortDropdown.tsx' />,
}

export const ViewSelector: Story = {
  name: 'viewSelector',
  render: () => <ComponentStoryRenderer path='src/components/domains/viewSelector.tsx' />,
}

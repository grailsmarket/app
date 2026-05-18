import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/search/components/loading-rows',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CategoryLoadingRow: Story = {
  name: 'categoryLoadingRow',
  render: () => (
    <ComponentStoryRenderer path='src/components/modal/search/components/loading-rows/categoryLoadingRow.tsx' />
  ),
}

export const NameLoadingRow: Story = {
  name: 'nameLoadingRow',
  render: () => (
    <ComponentStoryRenderer path='src/components/modal/search/components/loading-rows/nameLoadingRow.tsx' />
  ),
}

export const UserLoadingRow: Story = {
  name: 'userLoadingRow',
  render: () => (
    <ComponentStoryRenderer path='src/components/modal/search/components/loading-rows/userLoadingRow.tsx' />
  ),
}

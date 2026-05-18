import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/App/bulk-search',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const DomainPanel: Story = {
  name: 'domainPanel',
  render: () => <ComponentStoryRenderer path='src/app/bulk-search/components/domainPanel.tsx' />,
}

export const MainPanel: Story = {
  name: 'mainPanel',
  render: () => <ComponentStoryRenderer path='src/app/bulk-search/components/mainPanel.tsx' />,
}

export const TabSwitcher: Story = {
  name: 'tabSwitcher',
  render: () => <ComponentStoryRenderer path='src/app/bulk-search/components/tabSwitcher.tsx' />,
}

export const TextareaSection: Story = {
  name: 'textareaSection',
  render: () => <ComponentStoryRenderer path='src/app/bulk-search/components/textareaSection.tsx' />,
}

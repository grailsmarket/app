import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/posthog',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const PosthogGroupSync: Story = {
  name: 'posthog-group-sync',
  render: () => <ComponentStoryRenderer path='src/components/posthog/posthog-group-sync.tsx' />,
}

export const PosthogIdentify: Story = {
  name: 'posthog-identify',
  render: () => <ComponentStoryRenderer path='src/components/posthog/posthog-identify.tsx' />,
}

export const PosthogPageview: Story = {
  name: 'posthog-pageview',
  render: () => <ComponentStoryRenderer path='src/components/posthog/posthog-pageview.tsx' />,
}

export const PosthogProfileProperties: Story = {
  name: 'posthog-profile-properties',
  render: () => <ComponentStoryRenderer path='src/components/posthog/posthog-profile-properties.tsx' />,
}

export const PosthogProvider: Story = {
  name: 'posthog-provider',
  render: () => <ComponentStoryRenderer path='src/components/posthog/posthog-provider.tsx' />,
}

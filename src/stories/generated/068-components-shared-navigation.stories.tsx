import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/navigation',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Cart: Story = {
  name: 'cart',
  render: () => <ComponentStoryRenderer path='src/components/navigation/cart.tsx' />,
}

export const Chats: Story = {
  name: 'chats',
  render: () => <ComponentStoryRenderer path='src/components/navigation/chats.tsx' />,
}

export const Hamburger: Story = {
  name: 'hamburger',
  render: () => <ComponentStoryRenderer path='src/components/navigation/hamburger.tsx' />,
}

export const Navigation: Story = {
  name: 'index',
  render: () => <ComponentStoryRenderer path='src/components/navigation/index.tsx' />,
}

export const Notifications: Story = {
  name: 'notifications',
  render: () => <ComponentStoryRenderer path='src/components/navigation/notifications.tsx' />,
}

export const Pages: Story = {
  name: 'pages',
  render: () => <ComponentStoryRenderer path='src/components/navigation/pages.tsx' />,
}

export const SearchIcon: Story = {
  name: 'searchIcon',
  render: () => <ComponentStoryRenderer path='src/components/navigation/searchIcon.tsx' />,
}

export const Watchlist: Story = {
  name: 'watchlist',
  render: () => <ComponentStoryRenderer path='src/components/navigation/watchlist.tsx' />,
}

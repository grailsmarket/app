import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/ui',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ActivityTime: Story = {
  name: 'activityTime',
  render: () => <ComponentStoryRenderer path='src/components/ui/activityTime.tsx' />,
}

export const AnimateIn: Story = {
  name: 'animateIn',
  render: () => <ComponentStoryRenderer path='src/components/ui/animateIn.tsx' />,
}

export const Asset: Story = {
  name: 'asset',
  render: () => <ComponentStoryRenderer path='src/components/ui/asset.tsx' />,
}

export const BulkSelect: Story = {
  name: 'bulkSelect',
  render: () => <ComponentStoryRenderer path='src/components/ui/bulkSelect.tsx' />,
}

export const ContextMenu: Story = {
  name: 'contextMenu',
  render: () => <ComponentStoryRenderer path='src/components/ui/contextMenu.tsx' />,
}

export const Datepicker: Story = {
  name: 'datepicker',
  render: () => <ComponentStoryRenderer path='src/components/ui/datepicker.tsx' />,
}

export const DownloadButton: Story = {
  name: 'downloadButton',
  render: () => <ComponentStoryRenderer path='src/components/ui/downloadButton.tsx' />,
}

export const Dropdown: Story = {
  name: 'dropdown',
  render: () => <ComponentStoryRenderer path='src/components/ui/dropdown.tsx' />,
}

export const ExpandableTab: Story = {
  name: 'expandableTab',
  render: () => <ComponentStoryRenderer path='src/components/ui/expandableTab.tsx' />,
}

export const InfoBar: Story = {
  name: 'infoBar',
  render: () => <ComponentStoryRenderer path='src/components/ui/infoBar.tsx' />,
}

export const Input: Story = {
  name: 'input',
  render: () => <ComponentStoryRenderer path='src/components/ui/input.tsx' />,
}

export const Label: Story = {
  name: 'label',
  render: () => <ComponentStoryRenderer path='src/components/ui/label.tsx' />,
}

export const LoadingCell: Story = {
  name: 'loadingCell',
  render: () => <ComponentStoryRenderer path='src/components/ui/loadingCell.tsx' />,
}

export const LoadingSpinner: Story = {
  name: 'loadingSpinner',
  render: () => <ComponentStoryRenderer path='src/components/ui/loadingSpinner.tsx' />,
}

export const NameImage: Story = {
  name: 'nameImage',
  render: () => <ComponentStoryRenderer path='src/components/ui/nameImage.tsx' />,
}

export const NoResults: Story = {
  name: 'noResults',
  render: () => <ComponentStoryRenderer path='src/components/ui/noResults.tsx' />,
}

export const Price: Story = {
  name: 'price',
  render: () => <ComponentStoryRenderer path='src/components/ui/price.tsx' />,
}

export const Searchbar: Story = {
  name: 'searchbar',
  render: () => <ComponentStoryRenderer path='src/components/ui/searchbar.tsx' />,
}

export const SetEmailReminder: Story = {
  name: 'setEmailReminder',
  render: () => <ComponentStoryRenderer path='src/components/ui/setEmailReminder.tsx' />,
}

export const TabSelector: Story = {
  name: 'tabSelector',
  render: () => <ComponentStoryRenderer path='src/components/ui/tabSelector.tsx' />,
}

export const Textarea: Story = {
  name: 'textarea',
  render: () => <ComponentStoryRenderer path='src/components/ui/textarea.tsx' />,
}

export const Tooltip: Story = {
  name: 'tooltip',
  render: () => <ComponentStoryRenderer path='src/components/ui/tooltip.tsx' />,
}

export const User: Story = {
  name: 'user',
  render: () => <ComponentStoryRenderer path='src/components/ui/user.tsx' />,
}

export const Virtualgrid: Story = {
  name: 'virtualgrid',
  render: () => <ComponentStoryRenderer path='src/components/ui/virtualgrid.tsx' />,
}

export const Virtuallist: Story = {
  name: 'virtuallist',
  render: () => <ComponentStoryRenderer path='src/components/ui/virtuallist.tsx' />,
}

export const Watchlist: Story = {
  name: 'watchlist',
  render: () => <ComponentStoryRenderer path='src/components/ui/watchlist.tsx' />,
}

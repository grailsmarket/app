import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/records',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const BulkEditRecordsModal: Story = {
  name: 'bulkEditRecordsModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/records/bulkEditRecordsModal.tsx' />,
}

export const EditRecordsModal: Story = {
  name: 'editRecordsModal',
  render: () => <ComponentStoryRenderer path='src/components/modal/records/editRecordsModal.tsx' />,
}

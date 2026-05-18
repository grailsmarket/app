import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ComponentStoryRenderer } from '../component-story-renderer'

const meta = {
  title: 'Components/Shared/modal/registration/components',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const CollapsibleNameList: Story = {
  name: 'collapsible-name-list',
  render: () => (
    <ComponentStoryRenderer path='src/components/modal/registration/components/collapsible-name-list.tsx' />
  ),
}

export const CommittingView: Story = {
  name: 'committing-view',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/committing-view.tsx' />,
}

export const CostSummary: Story = {
  name: 'cost-summary',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/cost-summary.tsx' />,
}

export const CustomOwnerSection: Story = {
  name: 'custom-owner-section',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/custom-owner-section.tsx' />,
}

export const ErrorView: Story = {
  name: 'error-view',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/error-view.tsx' />,
}

export const ModalBackdrop: Story = {
  name: 'modal-backdrop',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/modal-backdrop.tsx' />,
}

export const NameCarousel: Story = {
  name: 'name-carousel',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/name-carousel.tsx' />,
}

export const PerNameDurationEditor: Story = {
  name: 'per-name-duration-editor',
  render: () => (
    <ComponentStoryRenderer path='src/components/modal/registration/components/per-name-duration-editor.tsx' />
  ),
}

export const RegisteringView: Story = {
  name: 'registering-view',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/registering-view.tsx' />,
}

export const RegistrationToast: Story = {
  name: 'registration-toast',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/registration-toast.tsx' />,
}

export const ReverseRecord: Story = {
  name: 'reverse-record',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/reverse-record.tsx' />,
}

export const ReviewForm: Story = {
  name: 'review-form',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/review-form.tsx' />,
}

export const SuccessToast: Story = {
  name: 'success-toast',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/success-toast.tsx' />,
}

export const SuccessView: Story = {
  name: 'success-view',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/success-view.tsx' />,
}

export const WaitingView: Story = {
  name: 'waiting-view',
  render: () => <ComponentStoryRenderer path='src/components/modal/registration/components/waiting-view.tsx' />,
}

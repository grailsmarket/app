'use client'

import { cn } from '@/utils/tailwind'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'

interface MobileFilterActionsProps {
  /** Dismiss the panel. */
  onClose: () => void
  /** Confirm the (live-applied) filters and dismiss the panel. */
  onApply: () => void
  /** Enables the Apply button — typically true once filters changed since opening. */
  canApply?: boolean
  /**
   * `absolute` pins the bar to the bottom of a non-scrolling panel root.
   * `sticky` pins it to the bottom of a scroll container (use when the bar lives
   * inside the scrollable area itself).
   */
  position?: 'absolute' | 'sticky'
  className?: string
}

/**
 * Bottom action bar for the filter panels on mobile. Visibility (mobile-only) is
 * controlled by the consumer, since each panel detects "mobile" differently.
 */
const MobileFilterActions: React.FC<MobileFilterActionsProps> = ({
  onClose,
  onApply,
  canApply = true,
  position = 'absolute',
  className,
}) => (
  <div
    className={cn(
      'border-tertiary bg-background inset-x-0 bottom-0 z-10 flex justify-end gap-2 border-t-2 p-4',
      position === 'sticky' ? 'sticky' : 'absolute',
      className
    )}
  >
    <SecondaryButton onClick={onClose}>Close</SecondaryButton>
    <PrimaryButton onClick={onApply} disabled={!canApply}>
      Apply
    </PrimaryButton>
  </div>
)

export default MobileFilterActions

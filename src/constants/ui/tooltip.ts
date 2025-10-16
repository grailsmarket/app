import { TooltipAlignType } from '@/types/ui'

export const TOOLTIP_POSITION_STYLES = {
  top: {
    bottom: '170%',
  },
  left: {
    right: '170%',
  },
  right: {
    left: '170%',
  },
  bottom: {
    top: '170%',
  },
} as const

export const ALIGN_STYLES = {
  top: { top: 0 },
  bottom: { bottom: 0 },
  right: { right: 0 },
  left: { left: 0 },
  center: { bottom: 0, transform: 'translateY(30%)' },
} as const

export const POINT_STYLES = {
  bottom: {
    left: {
      left: '10px',
      top: 0,
      transform: 'translateY(-50%) rotate(45deg)',
    },
    right: {
      right: '10px',
      top: 0,
      transform: 'translateY(-25%) rotate(45deg)',
    },
    center: {},
    top: {},
    bottom: {},
  },
  top: {
    left: {
      left: '10px',
      bottom: 0,
      transform: 'translateY(50%) rotate(45deg)',
    },
    right: {
      right: '10px',
      bottom: 0,
      transform: 'translateY(50%) rotate(45deg)',
    },
    center: {},
    top: {},
    bottom: {},
  },
  left: {
    top: { right: 0, top: '10px', transform: 'translateX(50%) rotate(45deg)' },
    bottom: {
      right: 0,
      bottom: '10px',
      transform: 'translateX(50%) rotate(45deg)',
    },
    center: {
      right: 0,
      bottom: 0,
      transform: 'translateX(-50%) translateY(-125%) rotate(45deg)',
    },
    left: {},
    right: {},
  },
  right: {
    top: { left: 0, top: '1', transform: 'translateX(-50%) rotate(45deg)' },
    bottom: {
      left: 0,
      bottom: '10px',
      transform: 'translateX(-50%) rotate(45deg)',
    },
    center: {
      left: 0,
      bottom: 0,
      transform: 'translateX(-50%) translateY(-125%) rotate(45deg)',
    },
    left: {},
    right: {},
  },
} as const

export const DEFAULT_TOOLTIP_STYLE = {
  zIndex: 100,
  background: 'var(--color-tertiary)',
  borderRadius: '2px',
  boxShadow: '0 4px 4px rgba(0,0,0,0.2)',
  padding: '12px',
} as const

export const DEFAULT_POINT_STYLE = {
  background: 'var(--color-tertiary)',
  zIndex: '-10',
  width: '12px',
  height: '12px',
} as const

export const AXIS_PLACEHOLDER = ['horizontal', 'vertical'] as const

export const POSITIONS: Record<(typeof AXIS_PLACEHOLDER)[number], TooltipAlignType[]> = {
  horizontal: ['left', 'right'],
  vertical: ['top', 'bottom', 'center'],
}

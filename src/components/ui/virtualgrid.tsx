import clsx from 'clsx'
import React, { useState, useCallback, forwardRef, ReactElement, ForwardedRef, useMemo } from 'react'

/**
 * Props for the VirtualGrid component
 * @template T - The type of items in the grid (must be serializable)
 */
export interface VirtualGridProps<T = unknown> {
  /** Array of items to render */
  items: T[]
  /** Width of each card in pixels */
  cardWidth: number
  /** Height of each card in pixels */
  cardHeight: number
  /** Gap between cards in pixels */
  gap?: number
  /** Container width to calculate columns */
  containerWidth?: number
  /** Number of extra rows to render outside visible area for smooth scrolling */
  overscanCount?: number
  /** CSS class name for the container */
  containerClassName?: string
  /** Height of the grid container */
  gridHeight?: string
  /** Function to render each item */
  renderItem: (item: T, index: number, columnsCount: number) => React.ReactNode
  /** Callback when scrolling near the bottom */
  onScrollNearBottom?: () => void
  /** Threshold in pixels from bottom to trigger onScrollNearBottom */
  scrollThreshold?: number
  /** Whether scrolling is enabled */
  scrollEnabled?: boolean
}

/**
 * Virtual grid component type with generic constraint
 */
export type VirtualGridComponentType = <T = unknown>(
  props: VirtualGridProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) => ReactElement

const VirtualGridComponent: VirtualGridComponentType = (props, ref) => {
  const {
    items,
    cardWidth,
    cardHeight,
    gap = 2,
    containerWidth = 1200,
    overscanCount = 2,
    gridHeight = '100%',
    containerClassName,
    renderItem,
    onScrollNearBottom,
    scrollThreshold = 300,
    scrollEnabled = true,
  } = props

  const [scrollTop, setScrollTop] = useState(0)

  // Calculate columns based on container width
  const columnsCount = useMemo(() => {
    const availableWidth = containerWidth - gap
    return Math.floor(availableWidth / (cardWidth + gap)) || 1
  }, [containerWidth, cardWidth, gap])

  // Calculate total rows
  const totalRows = Math.ceil(items.length / columnsCount)
  const rowHeight = cardHeight + gap

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const currentScrollTop = e.currentTarget.scrollTop
      setScrollTop(currentScrollTop)

      if (onScrollNearBottom) {
        const scrollHeight = e.currentTarget.scrollHeight
        const clientHeight = e.currentTarget.clientHeight

        if (scrollHeight - currentScrollTop - clientHeight < scrollThreshold) {
          onScrollNearBottom()
        }
      }
    },
    [onScrollNearBottom, scrollThreshold]
  )

  // Calculate visible rows
  const containerHeight = typeof gridHeight === 'number' ? gridHeight : 600
  // const visibleRows = Math.ceil(containerHeight / rowHeight)

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscanCount)
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscanCount)

  // Get items for visible rows
  const visibleItems: Array<{ item: (typeof items)[0]; index: number; row: number; col: number }> = []
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columnsCount; col++) {
      const index = row * columnsCount + col
      if (index < items.length) {
        visibleItems.push({
          item: items[index],
          index,
          row,
          col,
        })
      }
    }
  }

  const totalHeight = totalRows * rowHeight

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!scrollEnabled) {
        e.preventDefault()
      }
    },
    [scrollEnabled]
  )

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      onWheel={handleWheel}
      style={{
        height: gridHeight,
        overflowY: scrollEnabled ? 'auto' : 'hidden',
        position: 'relative',
        touchAction: scrollEnabled ? 'auto' : 'none',
      }}
      className={clsx(containerClassName, 'hide-scrollbar')}
    >
      <div
        style={{
          width: '100%',
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, row, col }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: col * (100 / columnsCount) + '%',
              width: (containerWidth - 20) / columnsCount - gap,
              height: cardHeight,
            }}
          >
            {renderItem(item, index, columnsCount)}
          </div>
        ))}
      </div>
    </div>
  )
}

const VirtualGrid = forwardRef(VirtualGridComponent) as unknown as (<T>(
  props: VirtualGridProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReactElement) & {
  displayName?: string
}

VirtualGrid.displayName = 'VirtualGrid'

export default VirtualGrid

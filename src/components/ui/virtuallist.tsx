import clsx from 'clsx'
import React, { useState, useCallback, forwardRef, ReactElement, ForwardedRef } from 'react'

/**
 * Props for the VirtualList component
 * @template T - The type of items in the list (must be serializable)
 */
export interface VirtualListProps<T = unknown> {
  /** Array of items to render */
  items: T[]
  /** Number of items visible at once */
  visibleCount: number
  /** Height of each row in pixels */
  rowHeight: number
  /** Number of extra items to render outside visible area for smooth scrolling */
  overscanCount?: number
  /** CSS class name for the container */
  containerClassName?: string
  /** Height of the list container */
  listHeight?: string
  /** Gap between items in pixels */
  gap?: number
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Callback when scrolling near the bottom */
  onScrollNearBottom?: () => void
  /** Threshold in pixels from bottom to trigger onScrollNearBottom */
  scrollThreshold?: number
}

/**
 * Virtual list component type with generic constraint
 */
export type VirtualListComponentType = <T = unknown>(
  props: VirtualListProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) => ReactElement

const VirtualListComponent: VirtualListComponentType = (props, ref) => {
  const {
    items,
    visibleCount,
    overscanCount = 3,
    rowHeight,
    renderItem,
    gap = 16,
    listHeight = '100%',
    containerClassName,
    onScrollNearBottom,
    scrollThreshold = 300,
  } = props

  const [scrollTop, setScrollTop] = useState(0)

  const containerHeight = visibleCount * (rowHeight + gap)!

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop
    setScrollTop(currentScrollTop)
    
    if (onScrollNearBottom) {
      const scrollHeight = e.currentTarget.scrollHeight
      const clientHeight = e.currentTarget.clientHeight
      
      if (scrollHeight - currentScrollTop - clientHeight < scrollThreshold) {
        onScrollNearBottom()
      }
    }
  }, [onScrollNearBottom, scrollThreshold])

  // Calculate startIndex and endIndex for the items to be rendered.
  let startIndex = 0
  let endIndex = items.length

  startIndex = Math.max(0, Math.floor(scrollTop / rowHeight!) - overscanCount)
  endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / rowHeight!) + overscanCount)

  // Total height of the list.
  const totalHeight = items.length * (rowHeight + gap)!

  const getOffset = (index: number): number => {
    return index * rowHeight!
  }

  const visibleItems = items.slice(startIndex, endIndex)

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      style={{
        maxHeight: listHeight,
        overflowY: 'auto',
        position: 'relative',
      }}
      className={clsx(containerClassName, 'hide-scrollbar')}
    >
      <div style={{ width: '100%', height: totalHeight, position: 'relative' }}>
        <div
          style={{
            width: '100%',
            position: 'absolute',
            top: getOffset(startIndex),
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap,
          }}
        >
          {visibleItems.map((item, i) => {
            const index = startIndex + i
            return (
              <div
                key={index}
                style={{
                  width: '100%',
                  height: rowHeight,
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  position: 'relative',
                }}
              >
                {renderItem(item, index)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const VirtualList = forwardRef(VirtualListComponent) as unknown as (<T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReactElement) & {
  displayName?: string
}

VirtualList.displayName = 'VirtualList'

export default VirtualList

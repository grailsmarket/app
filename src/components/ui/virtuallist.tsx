import clsx from 'clsx'
import React, { useState, useCallback, forwardRef, ReactElement, ForwardedRef } from 'react'

export interface VirtualListProps<T = unknown> {
  items: T[]
  visibleCount: number
  rowHeight: number
  overscanCount?: number
  containerClassName?: string
  listHeight?: string
  gap?: number
  renderItem: (item: T, index: number) => React.ReactNode
  onScrollNearBottom?: () => void
  scrollThreshold?: number
  paddingBottom?: string
  scrollEnabled?: boolean
}

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
    paddingBottom = '80px',
    scrollEnabled = true,
  } = props

  const [scrollTop, setScrollTop] = useState(0)

  const containerHeight = visibleCount * (rowHeight + gap)!

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
        maxHeight: listHeight,
        overflowY: scrollEnabled ? 'auto' : 'hidden',
        position: 'relative',
        paddingBottom,
        touchAction: scrollEnabled ? 'auto' : 'none',
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

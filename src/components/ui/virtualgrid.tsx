import { useVirtualScroll } from '@/hooks/useVirtualScroll'
import clsx from 'clsx'
import React, { useState, useCallback, forwardRef, ReactElement, ForwardedRef, useMemo, useEffect, useRef } from 'react'

export interface VirtualGridProps<T = unknown> {
  items: T[]
  cardWidth: number
  cardHeight: number
  gap?: number
  containerPadding?: number
  paddingBottom?: string | number
  containerWidth?: number
  overscanCount?: number
  containerClassName?: string
  renderItem: (item: T, index: number, columnsCount: number) => React.ReactNode
  onScrollNearBottom?: () => void
  scrollThreshold?: number
  useLocalScrollTop?: boolean
  maxColumns?: number
  minCardWidth?: number
}

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
    containerPadding = 20,
    paddingBottom = '80px',
    containerWidth = 1200,
    overscanCount = 3,
    containerClassName,
    renderItem,
    onScrollNearBottom,
    scrollThreshold = 300,
    useLocalScrollTop = false,
    maxColumns = 9,
    minCardWidth = 120,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ scrollY: 0, viewportHeight: 0 })
  const { elementTop, relativeScrollTop } = useVirtualScroll(containerRef, scrollState.scrollY, useLocalScrollTop)
  const onScrollNearBottomRef = useRef(onScrollNearBottom)

  // Keep onScrollNearBottom ref updated
  useEffect(() => {
    onScrollNearBottomRef.current = onScrollNearBottom
  }, [onScrollNearBottom])

  // Calculate columns based on container width
  const columnsCount = useMemo(() => {
    const availableWidth = containerWidth - gap - containerPadding * 2
    const calculatedColumns = Math.floor(availableWidth / (cardWidth + gap)) || 1

    // Limit to maxColumns if specified
    return Math.min(calculatedColumns, maxColumns)
  }, [containerWidth, cardWidth, gap, containerPadding, maxColumns])

  // Calculate actual card width when columns are constrained
  const actualCardWidth = useMemo(() => {
    const availableWidth = containerWidth - gap / columnsCount - containerPadding
    const totalGaps = (columnsCount - 1) * gap
    const calculatedWidth = (availableWidth - totalGaps) / columnsCount

    // Ensure card width doesn't go below minimum
    return Math.max(calculatedWidth, minCardWidth)
  }, [containerWidth, columnsCount, gap, containerPadding, minCardWidth])

  // Calculate total rows and heights
  const totalRows = Math.ceil(items.length / columnsCount)
  const rowHeight = cardHeight + gap
  const totalHeight = totalRows * rowHeight

  // Listen to window scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollState({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
      })
    }

    // Initial state
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  // Check if we're near the bottom of the grid content
  useEffect(() => {
    if (!onScrollNearBottomRef.current) return

    const viewportBottom = scrollState.scrollY + scrollState.viewportHeight
    const gridBottom = elementTop + totalHeight

    if (gridBottom - viewportBottom < scrollThreshold) {
      onScrollNearBottomRef.current()
    }
  }, [scrollState, elementTop, totalHeight, scrollThreshold])

  // Calculate visible rows
  const { startRow, endRow } = useMemo(() => {
    const viewportHeight = scrollState.viewportHeight || window.innerHeight

    const start = Math.max(0, Math.floor(relativeScrollTop / rowHeight) - overscanCount)
    const end = Math.min(totalRows, Math.ceil((relativeScrollTop + viewportHeight) / rowHeight) + overscanCount)

    return { startRow: start, endRow: end }
  }, [relativeScrollTop, rowHeight, scrollState.viewportHeight, totalRows, overscanCount])

  // Get items for visible rows
  const visibleItems = useMemo(() => {
    const result: Array<{ item: (typeof items)[0]; index: number; row: number; col: number }> = []
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < columnsCount; col++) {
        const index = row * columnsCount + col
        if (index < items.length) {
          result.push({
            item: items[index],
            index,
            row,
            col,
          })
        }
      }
    }
    return result
  }, [startRow, endRow, columnsCount, items])

  // Combine refs
  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
    },
    [ref]
  )

  return (
    <div
      ref={setRefs}
      style={{
        position: 'relative',
        paddingBottom,
        width: '100%',
      }}
      className={clsx(containerClassName)}
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
              left: containerPadding + col * (actualCardWidth + gap),
              width: actualCardWidth,
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

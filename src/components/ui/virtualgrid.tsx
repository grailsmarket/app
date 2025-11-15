import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import clsx from 'clsx'
import React, { useState, useCallback, forwardRef, ReactElement, ForwardedRef, useMemo, useEffect } from 'react'

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
  gridHeight?: string
  renderItem: (item: T, index: number, columnsCount: number) => React.ReactNode
  onScrollNearBottom?: () => void
  scrollThreshold?: number
  scrollEnabled?: boolean
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
    overscanCount = 2,
    gridHeight = '100%',
    containerClassName,
    renderItem,
    onScrollNearBottom,
    scrollThreshold = 300,
    scrollEnabled = true,
    useLocalScrollTop = false,
    maxColumns = 9,
    minCardWidth = 120,
  } = props

  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const [localScrollTop, setLocalScrollTop] = useState(0)

  const scrollTop = useLocalScrollTop ? localScrollTop : selectors.filters.scrollTop
  const setScrollTop = useMemo(
    () => (useLocalScrollTop ? setLocalScrollTop : (scrollTop: number) => dispatch(actions.setScrollTop(scrollTop))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useLocalScrollTop, actions]
  )

  useEffect(() => {
    // console.log('scrollTop', scrollTop)
    const virtualGrid = document.getElementById('virtual-grid')
    if (virtualGrid) {
      virtualGrid.scrollTop = scrollTop
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Calculate columns based on container width
  const columnsCount = useMemo(() => {
    const availableWidth = containerWidth - gap - containerPadding * 2
    const calculatedColumns = Math.floor(availableWidth / (cardWidth + gap)) || 1

    // Limit to maxColumns if specified
    return Math.min(calculatedColumns, maxColumns)
  }, [containerWidth, cardWidth, gap, containerPadding, maxColumns])

  // Calculate actual card width when columns are constrained
  const actualCardWidth = useMemo(() => {
    const availableWidth = containerWidth - gap - containerPadding
    const totalGaps = (columnsCount - 1) * gap
    const calculatedWidth = (availableWidth - totalGaps) / columnsCount

    // Ensure card width doesn't go below minimum
    return Math.max(calculatedWidth, minCardWidth)
  }, [containerWidth, columnsCount, gap, containerPadding, minCardWidth])

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
    [onScrollNearBottom, scrollThreshold, setScrollTop]
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

  const handleWheel = useCallback(() => {
    if (!scrollEnabled) {
      // Don't prevent default - let it bubble up
      return
    }
  }, [scrollEnabled])

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      onWheel={handleWheel}
      style={{
        height: gridHeight,
        overflowY: scrollEnabled ? 'auto' : 'hidden',
        overflowX: 'hidden',
        position: 'relative',
        paddingBottom,
        WebkitOverflowScrolling: 'touch',
      }}
      id='virtual-grid'
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

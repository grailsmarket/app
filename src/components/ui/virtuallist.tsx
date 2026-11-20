import { useVirtualScroll } from '@/hooks/useVirtualScroll'
import clsx from 'clsx'
import React, { useCallback, forwardRef, ReactElement, ForwardedRef, useEffect, useState, useMemo, useRef } from 'react'

export interface VirtualListProps<T = unknown> {
  items: T[]
  rowHeight: number
  overscanCount?: number
  containerClassName?: string
  gap?: number
  renderItem: (item: T, index: number) => React.ReactNode
  onScrollNearBottom?: () => void
  scrollThreshold?: number
  paddingBottom?: string
  useLocalScrollTop?: boolean
  containerScroll?: boolean
  containerHeight?: string
}

export type VirtualListComponentType = <T = unknown>(
  props: VirtualListProps<T>,
  ref: ForwardedRef<HTMLDivElement>
) => ReactElement

const VirtualListComponent: VirtualListComponentType = (props, ref) => {
  const {
    items,
    overscanCount = 5,
    rowHeight,
    renderItem,
    gap = 16,
    containerClassName,
    onScrollNearBottom,
    scrollThreshold = 300,
    paddingBottom = '80px',
    useLocalScrollTop = false,
    containerScroll = false,
    containerHeight,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ scrollY: 0, viewportHeight: 0 })
  const { elementTop, relativeScrollTop } = useVirtualScroll(
    containerRef,
    scrollState.scrollY,
    useLocalScrollTop,
    containerScroll
  )
  const onScrollNearBottomRef = useRef(onScrollNearBottom)

  // Keep onScrollNearBottom ref updated
  useEffect(() => {
    onScrollNearBottomRef.current = onScrollNearBottom
  }, [onScrollNearBottom])

  // Total height of the list content
  const totalHeight = items.length * (rowHeight + gap)

  // Listen to scroll events (window or container based on mode)
  useEffect(() => {
    if (containerScroll) {
      // Container scroll mode
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      const handleScroll = () => {
        setScrollState({
          scrollY: scrollContainer.scrollTop,
          viewportHeight: scrollContainer.clientHeight,
        })
      }

      // Initial state
      handleScroll()

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    } else {
      // Window scroll mode
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
    }
  }, [containerScroll])

  // Check if we're near the bottom of the list content
  useEffect(() => {
    if (!onScrollNearBottomRef.current) return

    if (containerScroll) {
      const distanceToBottom = totalHeight - (scrollState.scrollY + scrollState.viewportHeight)
      if (distanceToBottom < scrollThreshold) {
        onScrollNearBottomRef.current()
      }
    } else {
      const viewportBottom = scrollState.scrollY + scrollState.viewportHeight
      const listBottom = elementTop + totalHeight

      if (listBottom - viewportBottom < scrollThreshold) {
        onScrollNearBottomRef.current()
      }
    }
  }, [scrollState, elementTop, totalHeight, scrollThreshold, containerScroll])

  // Calculate startIndex and endIndex for the items to be rendered
  const { startIndex, endIndex } = useMemo(() => {
    const effectiveRowHeight = rowHeight + gap
    const viewportHeight = scrollState.viewportHeight || (typeof window !== 'undefined' ? window.innerHeight : 0)

    const start = Math.max(0, Math.floor(relativeScrollTop / effectiveRowHeight) - overscanCount)
    const end = Math.min(
      items.length,
      Math.ceil((relativeScrollTop + viewportHeight) / effectiveRowHeight) + overscanCount
    )

    return { startIndex: start, endIndex: end }
  }, [relativeScrollTop, rowHeight, gap, scrollState.viewportHeight, items.length, overscanCount])

  const getOffset = (index: number): number => {
    return index * (rowHeight + gap)
  }

  const visibleItems = items.slice(startIndex, endIndex)

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

  const innerContent = (
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
  )

  if (containerScroll) {
    return (
      <div
        ref={(el) => {
          scrollContainerRef.current = el
          setRefs(el)
        }}
        style={{
          position: 'relative',
          height: containerHeight || '100%',
          overflowY: 'auto',
          width: '100%',
        }}
        className={clsx(containerClassName)}
      >
        {innerContent}
      </div>
    )
  }

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
      {innerContent}
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

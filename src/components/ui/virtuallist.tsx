import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import clsx from 'clsx'
import React, {
  useCallback,
  forwardRef,
  ReactElement,
  ForwardedRef,
  useEffect,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react'

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

  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ scrollY: 0, viewportHeight: 0 })
  const [elementTop, setElementTop] = useState(0)
  const hasRestoredScroll = useRef(false)
  const onScrollNearBottomRef = useRef(onScrollNearBottom)

  // Keep onScrollNearBottom ref updated
  useEffect(() => {
    onScrollNearBottomRef.current = onScrollNearBottom
  }, [onScrollNearBottom])

  // Get stored scroll position
  const storedScrollTop = useMemo(
    () => (useLocalScrollTop || containerScroll ? 0 : selectors.filters.scrollTop),
    [useLocalScrollTop, containerScroll, selectors.filters.scrollTop]
  )

  const setStoredScrollTop = useMemo(
    () => {
      if (useLocalScrollTop || containerScroll) {
        return () => {} // No-op for local scroll or container scroll
      } else {
        return (scrollTop: number) => dispatch(actions.setScrollTop(scrollTop))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [useLocalScrollTop, containerScroll, actions]
  )

  // Total height of the list content
  const totalHeight = items.length * (rowHeight + gap)

  // Calculate element's position in document on mount and resize (only for window scroll mode)
  useEffect(() => {
    if (containerScroll) return

    const updateElementTop = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setElementTop(rect.top + window.scrollY)
      }
    }

    updateElementTop()

    // Update on resize
    window.addEventListener('resize', updateElementTop)

    // Use ResizeObserver for more accurate updates
    const resizeObserver = new ResizeObserver(updateElementTop)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateElementTop)
      resizeObserver.disconnect()
    }
  }, [containerScroll])

  // Restore scroll position on mount (only for window scroll mode)
  useLayoutEffect(() => {
    if (containerScroll) return
    if (!hasRestoredScroll.current && storedScrollTop > 0 && elementTop > 0) {
      // Calculate the window scroll position that would put us at the stored position
      const targetWindowScroll = elementTop + storedScrollTop
      window.scrollTo({ top: targetWindowScroll, behavior: 'instant' })
      hasRestoredScroll.current = true
    }
  }, [storedScrollTop, elementTop, containerScroll])

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

  // Calculate scroll position relative to the list
  const relativeScrollTop = useMemo(() => {
    if (containerScroll) {
      return scrollState.scrollY
    }
    return Math.max(0, scrollState.scrollY - elementTop)
  }, [scrollState.scrollY, elementTop, containerScroll])

  // Store scroll position for restoration (debounced, only for window scroll mode)
  useEffect(() => {
    if (containerScroll) return
    if (hasRestoredScroll.current || storedScrollTop === 0) {
      const timeoutId = setTimeout(() => {
        setStoredScrollTop(relativeScrollTop)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [relativeScrollTop, setStoredScrollTop, storedScrollTop, containerScroll])

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
    const viewportHeight = scrollState.viewportHeight || window.innerHeight

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

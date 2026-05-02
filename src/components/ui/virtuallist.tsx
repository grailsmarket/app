import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import { useWindowVirtualizer, useVirtualizer } from '@tanstack/react-virtual'
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

function getStableVirtualKey(item: unknown, index: number): React.Key {
  if (item !== null && item !== undefined && typeof item === 'object') {
    const record = item as Record<string, unknown>
    const stable = record['token_id'] ?? record['id'] ?? record['address'] ?? record['name']
    if (stable !== null && stable !== undefined) {
      return stable as React.Key
    }
  }
  return index
}

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

function VirtualListWindowInner<T>({
  items,
  rowHeight,
  overscanCount = 5,
  gap = 16,
  containerClassName,
  onScrollNearBottom,
  scrollThreshold = 300,
  paddingBottom = '80px',
  useLocalScrollTop = false,
  renderItem,
  forwardedRef,
}: VirtualListProps<T> & { forwardedRef: ForwardedRef<HTMLDivElement> }) {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const containerRef = useRef<HTMLDivElement>(null)
  const [elementTop, setElementTop] = useState(0)
  const hasRestoredScroll = useRef(false)
  const onScrollNearBottomRef = useRef(onScrollNearBottom)

  useEffect(() => {
    onScrollNearBottomRef.current = onScrollNearBottom
  }, [onScrollNearBottom])

  const storedScrollTop = useMemo(
    () => (useLocalScrollTop ? 0 : selectors.filters.scrollTop),
    [useLocalScrollTop, selectors.filters.scrollTop]
  )

  const setStoredScrollTop = useMemo(() => {
    if (useLocalScrollTop) return () => {}
    return (scrollTop: number) => dispatch(actions.setScrollTop(scrollTop))
  }, [useLocalScrollTop, dispatch, actions])

  useEffect(() => {
    const updateElementTop = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setElementTop(rect.top + window.scrollY)
      }
    }

    updateElementTop()
    window.addEventListener('resize', updateElementTop)

    const resizeObserver = new ResizeObserver(updateElementTop)
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => {
      window.removeEventListener('resize', updateElementTop)
      resizeObserver.disconnect()
    }
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => rowHeight + gap,
    overscan: overscanCount,
    getItemKey: (index) => getStableVirtualKey(items[index], index),
    useFlushSync: false,
    scrollMargin: elementTop,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useLayoutEffect(() => {
    if (!hasRestoredScroll.current && storedScrollTop > 0 && elementTop > 0) {
      window.scrollTo({ top: elementTop + storedScrollTop, behavior: 'instant' })
      hasRestoredScroll.current = true
    }
  }, [storedScrollTop, elementTop])

  const relativeScrollTop = Math.max(0, (typeof window !== 'undefined' ? window.scrollY : 0) - elementTop)

  useEffect(() => {
    if (hasRestoredScroll.current || storedScrollTop === 0) {
      if (typeof requestIdleCallback !== 'undefined') {
        const handle = requestIdleCallback(
          () => {
            setStoredScrollTop(relativeScrollTop)
          },
          { timeout: 500 }
        )
        return () => cancelIdleCallback(handle)
      }

      const timeoutId = window.setTimeout(() => {
        setStoredScrollTop(relativeScrollTop)
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [relativeScrollTop, setStoredScrollTop, storedScrollTop])

  useEffect(() => {
    if (!onScrollNearBottomRef.current) return

    const lastItem = virtualItems.at(-1)
    if (!lastItem) return


    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
    const totalHeight = virtualizer.getTotalSize()
    const listBottom = elementTop + totalHeight
    const viewportBottom = scrollY + viewportHeight

    if (listBottom - viewportBottom < scrollThreshold && lastItem.index >= items.length - 1) {
      onScrollNearBottomRef.current()
    }
  }, [virtualItems, elementTop, scrollThreshold, items.length, virtualizer])

  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element
      if (typeof forwardedRef === 'function') forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    },
    [forwardedRef]
  )

  return (
    <div
      ref={setRefs}
      style={{ position: 'relative', paddingBottom, width: '100%' }}
      className={clsx(containerClassName)}
    >
      <div style={{ width: '100%', height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map((vi) => (
          <div
            key={vi.key}
            data-index={vi.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: rowHeight,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              transform: `translateY(${vi.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            {renderItem(items[vi.index], vi.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

function VirtualListContainerInner<T>({
  items,
  rowHeight,
  overscanCount = 5,
  gap = 16,
  containerClassName,
  onScrollNearBottom,
  scrollThreshold = 300,
  containerHeight,
  renderItem,
  forwardedRef,
}: VirtualListProps<T> & { forwardedRef: ForwardedRef<HTMLDivElement> }) {
  useAppDispatch()
  useFilterRouter()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const onScrollNearBottomRef = useRef(onScrollNearBottom)

  useEffect(() => {
    onScrollNearBottomRef.current = onScrollNearBottom
  }, [onScrollNearBottom])

  const storedScrollTop = 0

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight + gap,
    overscan: overscanCount,
    getItemKey: (index) => getStableVirtualKey(items[index], index),
    useFlushSync: false,
    initialOffset: storedScrollTop,
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    if (!onScrollNearBottomRef.current) return

    const scrollElement = scrollContainerRef.current
    if (!scrollElement) return

    const totalHeight = virtualizer.getTotalSize()
    const distanceToBottom = totalHeight - (scrollElement.scrollTop + scrollElement.clientHeight)

    if (distanceToBottom < scrollThreshold) {
      onScrollNearBottomRef.current()
    }
  }, [virtualItems, scrollThreshold, virtualizer])

  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      scrollContainerRef.current = element
      if (typeof forwardedRef === 'function') forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    },
    [forwardedRef]
  )

  return (
    <div
      ref={setRefs}
      style={{ position: 'relative', height: containerHeight || '100%', overflowY: 'auto', width: '100%' }}
      className={clsx(containerClassName)}
    >
      <div style={{ width: '100%', height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualItems.map((vi) => (
          <div
            key={vi.key}
            data-index={vi.index}
            style={{
              position: 'absolute',
              top: vi.start,
              left: 0,
              width: '100%',
              height: rowHeight,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            {renderItem(items[vi.index], vi.index)}
          </div>
        ))}
      </div>
    </div>
  )
}

const VirtualListComponent: VirtualListComponentType = (props, ref) => {
  if (props.containerScroll) {
    return <VirtualListContainerInner {...props} forwardedRef={ref} />
  }
  return <VirtualListWindowInner {...props} forwardedRef={ref} />
}

const VirtualList = forwardRef(VirtualListComponent) as unknown as (<T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReactElement) & {
  displayName?: string
}

VirtualList.displayName = 'VirtualList'

export default VirtualList

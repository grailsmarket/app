import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import clsx from 'clsx'
import React, {
  useState,
  useCallback,
  forwardRef,
  ReactElement,
  ForwardedRef,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'

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

  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ scrollY: 0, viewportHeight: 0 })
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
  }, [useLocalScrollTop, actions])

  const columnsCount = useMemo(() => {
    const availableWidth = containerWidth - gap - containerPadding * 2
    const calculatedColumns = Math.floor(availableWidth / (cardWidth + gap)) || 1
    return Math.min(calculatedColumns, maxColumns)
  }, [containerWidth, cardWidth, gap, containerPadding, maxColumns])

  const actualCardWidth = useMemo(() => {
    const availableWidth = containerWidth - gap - containerPadding
    const totalGaps = (columnsCount - 1) * gap
    const calculatedWidth = (availableWidth - totalGaps) / columnsCount
    return Math.max(calculatedWidth, minCardWidth)
  }, [containerWidth, columnsCount, gap, containerPadding, minCardWidth])

  const totalRows = Math.ceil(items.length / columnsCount)

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

  useLayoutEffect(() => {
    if (!hasRestoredScroll.current && storedScrollTop > 0 && elementTop > 0) {
      const targetWindowScroll = elementTop + storedScrollTop
      window.scrollTo({ top: targetWindowScroll, behavior: 'instant' })
      hasRestoredScroll.current = true
    }
  }, [storedScrollTop, elementTop])

  useEffect(() => {
    const handleScroll = () => {
      setScrollState({
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
      })
    }

    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const relativeScrollTop = useMemo(() => Math.max(0, scrollState.scrollY - elementTop), [scrollState.scrollY, elementTop])

  useEffect(() => {
    if (hasRestoredScroll.current || storedScrollTop === 0) {
      const id = setTimeout(() => setStoredScrollTop(relativeScrollTop), 100)
      return () => clearTimeout(id)
    }
  }, [relativeScrollTop, setStoredScrollTop, storedScrollTop])

  const rowVirtualizer = useWindowVirtualizer({
    count: totalRows,
    estimateSize: () => cardHeight + gap,
    overscan: overscanCount,
    getItemKey: (i) => i,
    useFlushSync: false,
    scrollMargin: elementTop,
  })
  const virtualRows = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    if (!onScrollNearBottomRef.current) return
    const lastRow = virtualRows.at(-1)
    if (!lastRow) return
    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
    const totalHeight = rowVirtualizer.getTotalSize()
    const gridBottom = elementTop + totalHeight
    const viewportBottom = scrollY + viewportHeight
    if (gridBottom - viewportBottom < scrollThreshold && lastRow.index >= totalRows - 1) {
      onScrollNearBottomRef.current()
    }
  }, [virtualRows, rowVirtualizer, elementTop, scrollThreshold, totalRows])

  const setRefs = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element
      if (typeof ref === 'function') ref(element)
      else if (ref) ref.current = element
    },
    [ref]
  )

  return (
    <div
      ref={setRefs}
      style={{ position: 'relative', paddingBottom, width: '100%' }}
      className={clsx(containerClassName)}
    >
      <div style={{ width: '100%', height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {virtualRows.map((vRow) => {
          return Array.from({ length: columnsCount }, (_, col) => {
            const index = vRow.index * columnsCount + col
            if (index >= items.length) return null
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: containerPadding + col * (actualCardWidth + gap),
                  width: actualCardWidth,
                  height: cardHeight,
                  transform: `translateY(${vRow.start - rowVirtualizer.options.scrollMargin}px)`,
                }}
              >
                {renderItem(items[index], index, columnsCount)}
              </div>
            )
          })
        })}
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

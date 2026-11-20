import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'

export function useVirtualScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  scrollY: number,
  useLocalScrollTop: boolean,
  containerScroll = false
) {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const storedScrollTop = selectors.filters.scrollTop
  const setScrollTop = actions.setScrollTop
  const persistScroll = !useLocalScrollTop && !containerScroll
  const [elementTop, setElementTop] = useState<number | null>(null)
  const hasRestored = useRef(false)
  const relativeScrollTop = containerScroll ? scrollY : Math.max(0, scrollY - (elementTop ?? 0))

  useEffect(() => {
    const element = containerRef.current
    if (containerScroll || !element) return

    const measure = () => setElementTop(element.getBoundingClientRect().top + window.scrollY)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    // The profile header can change height without resizing the list itself.
    observer.observe(document.body)

    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [containerRef, containerScroll])

  useLayoutEffect(() => {
    if (!persistScroll || hasRestored.current || elementTop === null) return
    if (!storedScrollTop) {
      hasRestored.current = true
      return
    }

    // The browser applies its own history scroll before the next animation frame.
    const frame = requestAnimationFrame(() => {
      if (!containerRef.current) return

      const top = containerRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: top + storedScrollTop, behavior: 'instant' })
      hasRestored.current = true
    })

    return () => cancelAnimationFrame(frame)
  }, [persistScroll, storedScrollTop, elementTop, containerRef])

  useEffect(() => {
    if (!persistScroll || !setScrollTop || !hasRestored.current) return

    const timeout = setTimeout(() => dispatch(setScrollTop(relativeScrollTop)), 100)
    return () => clearTimeout(timeout)
  }, [persistScroll, setScrollTop, dispatch, relativeScrollTop])

  return { elementTop: elementTop ?? 0, relativeScrollTop }
}
